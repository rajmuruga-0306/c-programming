#include "config.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

static void trim(char *s) {
    char *p = s;
    int l = strlen(p);
    while(isspace(p[l - 1])) p[--l] = 0;
    while(*p && isspace(*p)) ++p, --l;
    memmove(s, p, l + 1);
}

int config_load(const char *filename, AppConfig *cfg) {
    FILE *f = fopen(filename, "r");
    if (!f) return -1;
    char line[512];
    while (fgets(line, sizeof(line), f)) {
        if (line[0] == '#' || line[0] == '\n') continue;
        char *eq = strchr(line, '=');
        if (!eq) continue;
        *eq = 0;
        char *k = line;
        char *v = eq + 1;
        trim(k);
        trim(v);
        if (strcmp(k, "port") == 0) cfg->port = atoi(v);
        else if (strcmp(k, "db_path") == 0) strncpy(cfg->db_path, v, 255);
        else if (strcmp(k, "frontend_path") == 0) strncpy(cfg->frontend_path, v, 255);
        else if (strcmp(k, "schema_path") == 0) strncpy(cfg->schema_path, v, 255);
    }
    fclose(f);
    return 0;
}
