#ifndef JSON_UTILS_H
#define JSON_UTILS_H

#include "http_server.h"
#include "../lib/cJSON.h"

void send_json_response(HttpResponse *res, int status_code, cJSON *json);
void send_json_error(HttpResponse *res, int status_code, const char *message);
void send_json_success(HttpResponse *res, const char *message, cJSON *data);
void send_cors_preflight(HttpResponse *res);

#endif
