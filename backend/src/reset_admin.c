#include <stdio.h>
#include <string.h>
#include "../lib/sqlite3.h"
#include "sha256.h"

int main(void) {
    char hash[65];
    sha256_hash("admin123", hash);
    printf("SHA-256 of 'admin123': %s\n", hash);

    sqlite3 *db;
    if (sqlite3_open("../database/hostel.db", &db) != SQLITE_OK) {
        fprintf(stderr, "Cannot open database\n");
        return 1;
    }

    // Delete old admin and insert with correct hash
    sqlite3_exec(db, "DELETE FROM admins WHERE username='admin';", NULL, NULL, NULL);

    sqlite3_stmt *stmt;
    const char *sql = "INSERT INTO admins (username, password_hash) VALUES ('admin', ?);";
    sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    sqlite3_bind_text(stmt, 1, hash, -1, SQLITE_STATIC);
    
    if (sqlite3_step(stmt) == SQLITE_DONE) {
        printf("Admin account reset successfully!\n");
        printf("Username: admin\n");
        printf("Password: admin123\n");
    } else {
        fprintf(stderr, "Failed to insert admin: %s\n", sqlite3_errmsg(db));
    }

    sqlite3_finalize(stmt);
    sqlite3_close(db);
    return 0;
}
