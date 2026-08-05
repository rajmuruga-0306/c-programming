#include "auth.h"
#include "sha256.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#endif

static AuthToken g_tokens[MAX_TOKENS];
static int g_token_count = 0;

char *auth_generate_token(int user_id, int is_admin) {
    char buf[128];
    unsigned int r1 = rand();
    unsigned int r2 = (unsigned int)time(NULL);
    snprintf(buf, sizeof(buf), "%d-%d-%u-%u", user_id, is_admin, r1, r2);

    char *token_str = malloc(65);
    sha256_hash(buf, token_str);

    // Evict expired or reuse slot
    time_t now = time(NULL);
    int slot = -1;
    for (int i = 0; i < MAX_TOKENS; i++) {
        if (g_tokens[i].expires < now) {
            slot = i;
            break;
        }
    }
    if (slot == -1) {
        if (g_token_count < MAX_TOKENS) {
            slot = g_token_count++;
        } else {
            slot = 0; // overwrite oldest
        }
    }

    strncpy(g_tokens[slot].token, token_str, 64);
    g_tokens[slot].token[64] = '\0';
    g_tokens[slot].user_id = user_id;
    g_tokens[slot].is_admin = is_admin;
    g_tokens[slot].expires = now + 86400; // 24 hours

    return token_str;
}

int auth_verify_token(const char *token, int *user_id, int *is_admin) {
    if (!token || strlen(token) == 0) return 0;
    time_t now = time(NULL);

    for (int i = 0; i < MAX_TOKENS; i++) {
        if (g_tokens[i].expires >= now && strcmp(g_tokens[i].token, token) == 0) {
            if (user_id) *user_id = g_tokens[i].user_id;
            if (is_admin) *is_admin = g_tokens[i].is_admin;
            return 1;
        }
    }
    return 0;
}

void auth_remove_token(const char *token) {
    if (!token) return;
    for (int i = 0; i < MAX_TOKENS; i++) {
        if (strcmp(g_tokens[i].token, token) == 0) {
            g_tokens[i].expires = 0;
            break;
        }
    }
}

int auth_get_user_id(const HttpRequest *req, int *is_admin) {
    if (!req || strlen(req->auth_header) == 0) return 0;
    const char *token = req->auth_header;
    if (strncmp(token, "Bearer ", 7) == 0) {
        token += 7;
    }
    int uid = 0, admin = 0;
    if (auth_verify_token(token, &uid, &admin)) {
        if (is_admin) *is_admin = admin;
        return uid;
    }
    return 0;
}
