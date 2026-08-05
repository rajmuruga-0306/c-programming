#ifndef DB_H
#define DB_H

#include "../lib/sqlite3.h"
#include "../lib/cJSON.h"

int db_init(const char *db_path, const char *schema_path);
void db_close(void);
sqlite3 *db_get(void);

int db_execute(const char *sql);
int db_execute_params(const char *sql, const char **params, int param_count);
cJSON *db_query_json(const char *sql, const char **params, int param_count);
int db_query_int(const char *sql, const char **params, int param_count);

#endif
