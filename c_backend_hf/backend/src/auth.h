#ifndef AUTH_H
#define AUTH_H

#include <time.h>
#include "http_server.h"

#define MAX_TOKENS 256
typedef struct {
    char token[65];
    int user_id;
    int is_admin;
    time_t expires;
} AuthToken;

char *auth_generate_token(int user_id, int is_admin);
int auth_verify_token(const char *token, int *user_id, int *is_admin);
void auth_remove_token(const char *token);
int auth_get_user_id(const HttpRequest *req, int *is_admin);

#endif
