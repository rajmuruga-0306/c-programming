#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "config.h"
#include "db.h"
#include "http_server.h"

int main(void) {
    AppConfig cfg = { 8080, "../database/hostel.db", "../frontend", "../database/schema.sql" };
    if (config_load("config.ini", &cfg) != 0) {
        printf("Using default configuration (port %d).\n", cfg.port);
    }
    char *env_port = getenv("PORT");
    if (env_port && strlen(env_port) > 0) {
        cfg.port = atoi(env_port);
    }

    if (db_init(cfg.db_path, cfg.schema_path) != 0) {
        fprintf(stderr, "Failed to initialize database\n");
        return 1;
    }

    printf("Starting HostelHub C Backend Server...\n");
    int ret = start_http_server(cfg.port, cfg.frontend_path);

    db_close();
    return ret;
}
