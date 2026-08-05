#include "json_utils.h"

void send_json_response(HttpResponse *res, int status_code, cJSON *json) {
    send_json_res(res, status_code, json);
}

void send_json_error(HttpResponse *res, int status_code, const char *message) {
    send_json_err(res, status_code, message);
}

void send_json_success(HttpResponse *res, const char *message, cJSON *data) {
    send_json_ok(res, message, data);
}

void send_cors_preflight(HttpResponse *res) {
    send_cors_options(res);
}
