#include "routes.h"
#include "handlers_student.h"
#include "handlers_admin.h"
#include "json_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

extern char g_frontend_path[256];

static const char *get_mime_type(const char *path) {
    const char *ext = strrchr(path, '.');
    if (!ext) return "application/octet-stream";
    if (strcmp(ext, ".html") == 0) return "text/html";
    if (strcmp(ext, ".css") == 0) return "text/css";
    if (strcmp(ext, ".js") == 0) return "application/javascript";
    if (strcmp(ext, ".json") == 0) return "application/json";
    if (strcmp(ext, ".png") == 0) return "image/png";
    if (strcmp(ext, ".jpg") == 0) return "image/jpeg";
    if (strcmp(ext, ".svg") == 0) return "image/svg+xml";
    if (strcmp(ext, ".ico") == 0) return "image/x-icon";
    return "application/octet-stream";
}

void route_dispatch(const HttpRequest *req, HttpResponse *res) {
    if (strcmp(req->method, "OPTIONS") == 0) {
        send_cors_preflight(res);
        return;
    }

    const char *url = req->path;
    const char *method = req->method;

    // API Routes
    if (strncmp(url, "/api/", 5) == 0) {
        if (strcmp(url, "/api/hostel-blocks") == 0 && strcmp(method, "GET") == 0) {
            handle_hostel_blocks_list(req, res);
            return;
        }
        if (strcmp(url, "/api/student/register") == 0 && strcmp(method, "POST") == 0) {
            handle_student_register(req, res);
            return;
        }
        if (strcmp(url, "/api/student/login") == 0 && strcmp(method, "POST") == 0) {
            handle_student_login(req, res);
            return;
        }
        if (strcmp(url, "/api/application/submit") == 0 && strcmp(method, "POST") == 0) {
            handle_application_submit(req, res);
            return;
        }
        if (strncmp(url, "/api/application/status", 23) == 0 && strcmp(method, "GET") == 0) {
            handle_application_status(req, res);
            return;
        }
        if (strncmp(url, "/api/allotment/", 15) == 0 && strcmp(method, "GET") == 0) {
            handle_allotment_get(req, res);
            return;
        }

        if (strcmp(url, "/api/admin/login") == 0 && strcmp(method, "POST") == 0) {
            handle_admin_login(req, res);
            return;
        }
        if ((strcmp(url, "/api/rooms") == 0 || strcmp(url, "/api/admin/rooms") == 0) && strcmp(method, "GET") == 0) {
            handle_rooms_list(req, res);
            return;
        }
        if ((strcmp(url, "/api/rooms/add") == 0 || strcmp(url, "/api/admin/rooms") == 0) && strcmp(method, "POST") == 0) {
            handle_rooms_add(req, res);
            return;
        }
        if (strncmp(url, "/api/rooms/update/", 18) == 0 && strcmp(method, "PUT") == 0) {
            handle_rooms_update(req, res);
            return;
        }
        if (strncmp(url, "/api/rooms/delete/", 18) == 0 && strcmp(method, "DELETE") == 0) {
            handle_rooms_delete(req, res);
            return;
        }
        if ((strcmp(url, "/api/applications") == 0 || strcmp(url, "/api/admin/applications") == 0) && strcmp(method, "GET") == 0) {
            handle_applications_list(req, res);
            return;
        }
        if ((strncmp(url, "/api/application/status-update/", 31) == 0 || strncmp(url, "/api/admin/applications/", 24) == 0) && strcmp(method, "PUT") == 0) {
            handle_application_status_update(req, res);
            return;
        }
        if ((strcmp(url, "/api/allotment/auto-run") == 0 || strcmp(url, "/api/admin/allotment/auto") == 0) && strcmp(method, "POST") == 0) {
            handle_allotment_auto(req, res);
            return;
        }
        if ((strcmp(url, "/api/allotment/manual-assign") == 0 || strcmp(url, "/api/admin/allotment/manual") == 0) && strcmp(method, "POST") == 0) {
            handle_allotment_manual(req, res);
            return;
        }
        if ((strcmp(url, "/api/reports/occupancy") == 0 || strcmp(url, "/api/admin/reports/occupancy") == 0) && strcmp(method, "GET") == 0) {
            handle_reports_occupancy(req, res);
            return;
        }
        if ((strcmp(url, "/api/reports/vacant-rooms") == 0 || strcmp(url, "/api/admin/reports/vacant") == 0) && strcmp(method, "GET") == 0) {
            handle_reports_vacant(req, res);
            return;
        }
        if ((strcmp(url, "/api/admin/dashboard-stats") == 0 || strcmp(url, "/api/admin/dashboard") == 0) && strcmp(method, "GET") == 0) {
            handle_dashboard_stats(req, res);
            return;
        }

        send_json_error(res, 404, "API endpoint not found");
        return;
    }

    // Serve Static Files
    char path[512];
    if (strcmp(url, "/") == 0) {
        snprintf(path, sizeof(path), "%s/index.html", g_frontend_path);
    } else {
        snprintf(path, sizeof(path), "%s%s", g_frontend_path, url);
    }

    FILE *f = fopen(path, "rb");
    if (!f) {
        // Fallback to index.html for SPA routing if not found
        snprintf(path, sizeof(path), "%s/index.html", g_frontend_path);
        f = fopen(path, "rb");
    }

    if (!f) {
        send_json_error(res, 404, "Frontend file not found");
        return;
    }

    fseek(f, 0, SEEK_END);
    long size = ftell(f);
    fseek(f, 0, SEEK_SET);

    char *buf = malloc(size > 0 ? size : 1);
    if (size > 0) {
        fread(buf, 1, size, f);
    }
    fclose(f);

    res->status_code = 200;
    strncpy(res->content_type, get_mime_type(path), sizeof(res->content_type)-1);
    res->body = buf;
    res->body_len = size;
    res->is_allocated = 1;
}
