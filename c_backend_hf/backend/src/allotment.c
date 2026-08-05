#include "allotment.h"
#include "db.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

cJSON *allotment_auto_run(void) {
    cJSON *apps = db_query_json(
        "SELECT a.id, a.student_id, a.preferred_block, a.preferred_room_type, a.floor_preference, s.year "
        "FROM applications a "
        "JOIN students s ON a.student_id = s.id "
        "WHERE a.status = 'pending' "
        "ORDER BY s.year DESC, a.applied_on ASC",
        NULL, 0
    );

    int allotted = 0, waitlisted = 0;
    int num_apps = apps ? cJSON_GetArraySize(apps) : 0;

    for (int i = 0; i < num_apps; i++) {
        cJSON *app = cJSON_GetArrayItem(apps, i);
        int app_id = cJSON_GetObjectItemCaseSensitive(app, "id")->valueint;
        int student_id = cJSON_GetObjectItemCaseSensitive(app, "student_id")->valueint;
        cJSON *pref_block_node = cJSON_GetObjectItemCaseSensitive(app, "preferred_block");
        int pref_block = (pref_block_node && cJSON_IsNumber(pref_block_node)) ? pref_block_node->valueint : 1;
        cJSON *pref_rtype_node = cJSON_GetObjectItemCaseSensitive(app, "preferred_room_type");
        const char *pref_rtype = (pref_rtype_node && pref_rtype_node->valuestring) ? pref_rtype_node->valuestring : "double";

        char block_str[16];
        snprintf(block_str, sizeof(block_str), "%d", pref_block);

        // 1. Try exact match (preferred block + preferred room type)
        const char *params1[2] = { block_str, pref_rtype };
        cJSON *rooms = db_query_json(
            "SELECT id FROM rooms WHERE block_id = ? AND room_type = ? AND occupied_count < capacity AND status = 'available' LIMIT 1",
            params1, 2
        );

        // 2. Fallback: preferred block, any room type
        if (!rooms || cJSON_GetArraySize(rooms) == 0) {
            if (rooms) cJSON_Delete(rooms);
            const char *params2[1] = { block_str };
            rooms = db_query_json(
                "SELECT id FROM rooms WHERE block_id = ? AND occupied_count < capacity AND status = 'available' LIMIT 1",
                params2, 1
            );
        }

        // 3. Fallback: any block, preferred room type
        if (!rooms || cJSON_GetArraySize(rooms) == 0) {
            if (rooms) cJSON_Delete(rooms);
            const char *params3[1] = { pref_rtype };
            rooms = db_query_json(
                "SELECT id FROM rooms WHERE room_type = ? AND occupied_count < capacity AND status = 'available' LIMIT 1",
                params3, 1
            );
        }

        if (rooms && cJSON_GetArraySize(rooms) > 0) {
            int room_id = cJSON_GetObjectItemCaseSensitive(cJSON_GetArrayItem(rooms, 0), "id")->valueint;
            char s_str[16], r_str[16], a_str[16];
            snprintf(s_str, sizeof(s_str), "%d", student_id);
            snprintf(r_str, sizeof(r_str), "%d", room_id);
            snprintf(a_str, sizeof(a_str), "%d", app_id);

            const char *ip[3] = { a_str, r_str, s_str };
            db_execute_params("INSERT INTO allotments (application_id, room_id, student_id, allotted_by) VALUES (?, ?, ?, 'auto')", ip, 3);

            const char *up[1] = { r_str };
            db_execute_params("UPDATE rooms SET occupied_count = occupied_count + 1 WHERE id = ?", up, 1);
            db_execute_params("UPDATE rooms SET status = 'full' WHERE id = ? AND occupied_count >= capacity", up, 1);

            const char *ap[1] = { a_str };
            db_execute_params("UPDATE applications SET status = 'allotted' WHERE id = ?", ap, 1);
            allotted++;
        } else {
            char a_str[16];
            snprintf(a_str, sizeof(a_str), "%d", app_id);
            const char *ap[1] = { a_str };
            db_execute_params("UPDATE applications SET status = 'waitlisted' WHERE id = ?", ap, 1);
            waitlisted++;
        }
        if (rooms) cJSON_Delete(rooms);
    }
    if (apps) cJSON_Delete(apps);

    cJSON *res = cJSON_CreateObject();
    cJSON_AddNumberToObject(res, "allotted", allotted);
    cJSON_AddNumberToObject(res, "waitlisted", waitlisted);
    cJSON_AddNumberToObject(res, "total_processed", allotted + waitlisted);
    return res;
}

int allotment_manual_assign(int student_id, int room_id, const char *admin_username) {
    char s_str[16], r_str[16];
    snprintf(s_str, sizeof(s_str), "%d", student_id);
    snprintf(r_str, sizeof(r_str), "%d", room_id);

    const char *chk[1] = { r_str };
    int avail = db_query_int("SELECT (capacity - occupied_count) FROM rooms WHERE id = ?", chk, 1);
    if (avail <= 0) return -1;

    // Find student's application
    const char *schk[1] = { s_str };
    cJSON *app_rows = db_query_json("SELECT id FROM applications WHERE student_id = ? ORDER BY id DESC LIMIT 1", schk, 1);
    int app_id = 0;
    if (app_rows && cJSON_GetArraySize(app_rows) > 0) {
        app_id = cJSON_GetObjectItemCaseSensitive(cJSON_GetArrayItem(app_rows, 0), "id")->valueint;
    }
    if (app_rows) cJSON_Delete(app_rows);

    char a_str[16];
    snprintf(a_str, sizeof(a_str), "%d", app_id);

    const char *params[4] = { a_str, r_str, s_str, (admin_username && strlen(admin_username) > 0) ? admin_username : "admin" };
    int rc = db_execute_params("INSERT INTO allotments (application_id, room_id, student_id, allotted_by) VALUES (?, ?, ?, ?)", params, 4);
    if (rc != 0) return -1;

    db_execute_params("UPDATE rooms SET occupied_count = occupied_count + 1 WHERE id = ?", chk, 1);
    db_execute_params("UPDATE rooms SET status = 'full' WHERE id = ? AND occupied_count >= capacity", chk, 1);
    if (app_id > 0) {
        const char *ap[1] = { a_str };
        db_execute_params("UPDATE applications SET status = 'allotted' WHERE id = ?", ap, 1);
    }

    return 0;
}
