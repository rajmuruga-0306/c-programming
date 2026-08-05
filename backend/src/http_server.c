#include "http_server.h"
#include "routes.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#pragma comment(lib, "ws2_32.lib")
typedef SOCKET socket_t;
#define CLOSE_SOCKET(s) closesocket(s)
#else
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <pthread.h>
typedef int socket_t;
#define CLOSE_SOCKET(s) close(s)
#define INVALID_SOCKET -1
#define SOCKET_ERROR -1
#endif

char g_frontend_path[256] = "../frontend";

void http_response_init(HttpResponse *res) {
    memset(res, 0, sizeof(HttpResponse));
    res->status_code = 200;
    strcpy(res->content_type, "text/html; charset=utf-8");
}

void http_response_free(HttpResponse *res) {
    if (res->is_allocated && res->body) {
        free(res->body);
        res->body = NULL;
    }
}

void send_json_res(HttpResponse *res, int status_code, cJSON *json) {
    res->status_code = status_code;
    strcpy(res->content_type, "application/json");
    if (json) {
        res->body = cJSON_PrintUnformatted(json);
        res->body_len = res->body ? strlen(res->body) : 0;
        res->is_allocated = 1;
        cJSON_Delete(json);
    } else {
        res->body = strdup("{}");
        res->body_len = 2;
        res->is_allocated = 1;
    }
}

void send_json_err(HttpResponse *res, int status_code, const char *message) {
    cJSON *json = cJSON_CreateObject();
    cJSON_AddStringToObject(json, "error", message ? message : "Unknown error");
    send_json_res(res, status_code, json);
}

void send_json_ok(HttpResponse *res, const char *message, cJSON *data) {
    cJSON *json = cJSON_CreateObject();
    cJSON_AddStringToObject(json, "message", message ? message : "Success");
    if (data) {
        cJSON_AddItemToObject(json, "data", data);
    }
    send_json_res(res, 200, json);
}

void send_cors_options(HttpResponse *res) {
    res->status_code = 200;
    strcpy(res->content_type, "text/plain");
    res->body = strdup("");
    res->body_len = 0;
    res->is_allocated = 1;
}

static const char *get_status_text(int code) {
    switch (code) {
        case 200: return "OK";
        case 201: return "Created";
        case 400: return "Bad Request";
        case 401: return "Unauthorized";
        case 403: return "Forbidden";
        case 404: return "Not Found";
        case 500: return "Internal Server Error";
        default:  return "OK";
    }
}

static void send_full_response(socket_t client_sock, HttpResponse *res) {
    char header[1024];
    int header_len = snprintf(header, sizeof(header),
        "HTTP/1.1 %d %s\r\n"
        "Content-Type: %s\r\n"
        "Content-Length: %zu\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Connection: close\r\n\r\n",
        res->status_code,
        get_status_text(res->status_code),
        res->content_type,
        res->body_len
    );

    send(client_sock, header, header_len, 0);
    if (res->body && res->body_len > 0) {
        send(client_sock, res->body, (int)res->body_len, 0);
    }
}

typedef struct {
    socket_t client_sock;
} ThreadArgs;

#ifdef _WIN32
static DWORD WINAPI handle_client(LPVOID param)
#else
static void *handle_client(void *param)
#endif
{
    ThreadArgs *args = (ThreadArgs*)param;
    socket_t client_sock = args->client_sock;
    free(args);

    char buffer[8192];
    int bytes_received = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
    if (bytes_received <= 0) {
        CLOSE_SOCKET(client_sock);
#ifdef _WIN32
        return 0;
#else
        return NULL;
#endif
    }
    buffer[bytes_received] = '\0';

    HttpRequest req;
    memset(&req, 0, sizeof(HttpRequest));

    // Parse HTTP request line
    char *line_end = strstr(buffer, "\r\n");
    if (!line_end) {
        CLOSE_SOCKET(client_sock);
#ifdef _WIN32
        return 0;
#else
        return NULL;
#endif
    }

    char raw_url[512] = {0};
    sscanf(buffer, "%15s %511s", req.method, raw_url);

    // Separate path and query string
    char *q = strchr(raw_url, '?');
    if (q) {
        *q = '\0';
        strncpy(req.path, raw_url, sizeof(req.path) - 1);
        strncpy(req.query, q + 1, sizeof(req.query) - 1);
    } else {
        strncpy(req.path, raw_url, sizeof(req.path) - 1);
    }

    // Parse Headers
    char *auth_pos = strstr(buffer, "Authorization:");
    if (!auth_pos) auth_pos = strstr(buffer, "authorization:");
    if (auth_pos) {
        char *auth_end = strstr(auth_pos, "\r\n");
        if (auth_end) {
            size_t len = auth_end - (auth_pos + 14);
            if (len > sizeof(req.auth_header) - 1) len = sizeof(req.auth_header) - 1;
            strncpy(req.auth_header, auth_pos + 14, len);
            // Trim leading spaces
            char *p = req.auth_header;
            while (*p == ' ') p++;
            if (p != req.auth_header) memmove(req.auth_header, p, strlen(p) + 1);
        }
    }

    // Find Body
    char *body_start = strstr(buffer, "\r\n\r\n");
    if (body_start) {
        body_start += 4;
        req.body_len = bytes_received - (body_start - buffer);
        req.body = strdup(body_start);
    } else {
        req.body = strdup("");
        req.body_len = 0;
    }

    HttpResponse res;
    http_response_init(&res);

    // Route request
    route_dispatch(&req, &res);

    // Send HTTP response
    send_full_response(client_sock, &res);

    http_response_free(&res);
    if (req.body) free(req.body);
    CLOSE_SOCKET(client_sock);

#ifdef _WIN32
    return 0;
#else
    return NULL;
#endif
}

int start_http_server(int port, const char *frontend_dir) {
    if (frontend_dir && strlen(frontend_dir) > 0) {
        strncpy(g_frontend_path, frontend_dir, sizeof(g_frontend_path) - 1);
    }

#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        printf("Failed to initialize Winsock.\n");
        return -1;
    }
#endif

    socket_t server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (server_sock == INVALID_SOCKET) {
        printf("Failed to create socket.\n");
        return -1;
    }

    int opt = 1;
    setsockopt(server_sock, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(port);

    if (bind(server_sock, (struct sockaddr*)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        printf("Failed to bind socket on port %d.\n", port);
        CLOSE_SOCKET(server_sock);
        return -1;
    }

    if (listen(server_sock, SOMAXCONN) == SOCKET_ERROR) {
        printf("Failed to listen on socket.\n");
        CLOSE_SOCKET(server_sock);
        return -1;
    }

    printf("=========================================================\n");
    printf("   HostelHub Server running on http://localhost:%d\n", port);
    printf("=========================================================\n");

    while (1) {
        struct sockaddr_in client_addr;
        int client_len = sizeof(client_addr);
        socket_t client_sock = accept(server_sock, (struct sockaddr*)&client_addr, &client_len);

        if (client_sock == INVALID_SOCKET) continue;

        ThreadArgs *args = malloc(sizeof(ThreadArgs));
        args->client_sock = client_sock;

#ifdef _WIN32
        HANDLE thread = CreateThread(NULL, 0, handle_client, args, 0, NULL);
        if (thread) CloseHandle(thread);
#else
        pthread_t thread;
        pthread_create(&thread, NULL, handle_client, args);
        pthread_detach(thread);
#endif
    }

    CLOSE_SOCKET(server_sock);
#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
