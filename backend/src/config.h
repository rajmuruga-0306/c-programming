#ifndef CONFIG_H
#define CONFIG_H

typedef struct {
    int port;
    char db_path[256];
    char frontend_path[256];
    char schema_path[256];
} AppConfig;

int config_load(const char *filename, AppConfig *cfg);

#endif
