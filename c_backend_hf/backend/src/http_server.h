#ifndef HTTP_SERVER_H
#define HTTP_SERVER_H

#include <stddef.h>
#include "../lib/cJSON.h"

typedef struct {
    char method[16];
    char path[512];
    char query[512];
    char auth_header[256];
    char *body;
    size_t body_len;
} HttpRequest;

typedef struct {
    int status_code;
    char content_type[64];
    char *body;
    size_t body_len;
    int is_allocated;
} HttpResponse;

void http_response_init(HttpResponse *res);
void http_response_free(HttpResponse *res);

void send_json_res(HttpResponse *res, int status_code, cJSON *json);
void send_json_err(HttpResponse *res, int status_code, const char *message);
void send_json_ok(HttpResponse *res, const char *message, cJSON *data);
void send_cors_options(HttpResponse *res);

int start_http_server(int port, const char *frontend_dir);

#endif
