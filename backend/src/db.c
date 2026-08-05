#include "db.h"
#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <string.h>

static sqlite3 *db = NULL;
static pthread_mutex_t db_mutex = PTHREAD_MUTEX_INITIALIZER;

int db_init(const char *db_path, const char *schema_path) {
    if (sqlite3_open(db_path, &db) != SQLITE_OK) {
        fprintf(stderr, "Cannot open database: %s\n", sqlite3_errmsg(db));
        return -1;
    }
    
    // Enable WAL and foreign keys
    sqlite3_exec(db, "PRAGMA journal_mode=WAL;", NULL, NULL, NULL);
    sqlite3_exec(db, "PRAGMA foreign_keys=ON;", NULL, NULL, NULL);

    FILE *f = fopen(schema_path, "r");
    if (f) {
        fseek(f, 0, SEEK_END);
        long fsize = ftell(f);
        fseek(f, 0, SEEK_SET);

        char *sql = malloc(fsize + 1);
        fread(sql, 1, fsize, f);
        sql[fsize] = 0;
        fclose(f);

        char *errmsg = NULL;
        if (sqlite3_exec(db, sql, NULL, NULL, &errmsg) != SQLITE_OK) {
            fprintf(stderr, "SQL error in schema: %s\n", errmsg);
            sqlite3_free(errmsg);
        }
        free(sql);
    }
    return 0;
}

void db_close(void) {
    if (db) sqlite3_close(db);
}

sqlite3 *db_get(void) {
    return db;
}

int db_execute(const char *sql) {
    pthread_mutex_lock(&db_mutex);
    char *errmsg = NULL;
    int rc = sqlite3_exec(db, sql, NULL, NULL, &errmsg);
    if (rc != SQLITE_OK) {
        sqlite3_free(errmsg);
    }
    pthread_mutex_unlock(&db_mutex);
    return rc == SQLITE_OK ? 0 : -1;
}

int db_execute_params(const char *sql, const char **params, int param_count) {
    pthread_mutex_lock(&db_mutex);
    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        pthread_mutex_unlock(&db_mutex);
        return -1;
    }
    for (int i = 0; i < param_count; i++) {
        sqlite3_bind_text(stmt, i + 1, params[i], -1, SQLITE_STATIC);
    }
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&db_mutex);
    return (rc == SQLITE_DONE || rc == SQLITE_ROW) ? 0 : -1;
}

cJSON *db_query_json(const char *sql, const char **params, int param_count) {
    pthread_mutex_lock(&db_mutex);
    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        pthread_mutex_unlock(&db_mutex);
        return NULL;
    }
    for (int i = 0; i < param_count; i++) {
        sqlite3_bind_text(stmt, i + 1, params[i], -1, SQLITE_STATIC);
    }

    cJSON *array = cJSON_CreateArray();
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        cJSON *obj = cJSON_CreateObject();
        int cols = sqlite3_column_count(stmt);
        for (int i = 0; i < cols; i++) {
            const char *col_name = sqlite3_column_name(stmt, i);
            int type = sqlite3_column_type(stmt, i);
            if (type == SQLITE_INTEGER) {
                cJSON_AddNumberToObject(obj, col_name, sqlite3_column_int(stmt, i));
            } else if (type == SQLITE_FLOAT) {
                cJSON_AddNumberToObject(obj, col_name, sqlite3_column_double(stmt, i));
            } else if (type == SQLITE_TEXT) {
                cJSON_AddStringToObject(obj, col_name, (const char *)sqlite3_column_text(stmt, i));
            } else if (type == SQLITE_NULL) {
                cJSON_AddNullToObject(obj, col_name);
            }
        }
        cJSON_AddItemToArray(array, obj);
    }
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&db_mutex);
    return array;
}

int db_query_int(const char *sql, const char **params, int param_count) {
    pthread_mutex_lock(&db_mutex);
    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        pthread_mutex_unlock(&db_mutex);
        return -1;
    }
    for (int i = 0; i < param_count; i++) {
        sqlite3_bind_text(stmt, i + 1, params[i], -1, SQLITE_STATIC);
    }
    int result = -1;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        result = sqlite3_column_int(stmt, 0);
    }
    sqlite3_finalize(stmt);
    pthread_mutex_unlock(&db_mutex);
    return result;
}
