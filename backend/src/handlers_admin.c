#include "handlers_admin.h"
#include "db.h"
#include "auth.h"
#include "sha256.h"
#include "json_utils.h"
#include "allotment.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_admin_login(const HttpRequest *req, HttpResponse *res) {
    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *username = cJSON_GetObjectItemCaseSensitive(json, "username");
    cJSON *pass = cJSON_GetObjectItemCaseSensitive(json, "password");

    if (!username || !pass || !cJSON_IsString(username) || !cJSON_IsString(pass)) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing username or password");
        return;
    }

    char pass_hash[65];
    sha256_hash(pass->valuestring, pass_hash);

    const char *params[2] = { username->valuestring, pass_hash };
    cJSON *rows = db_query_json(
        "SELECT id, username FROM admins WHERE username = ? AND password_hash = ?",
        params, 2
    );

    cJSON_Delete(json);

    if (!rows || cJSON_GetArraySize(rows) == 0) {
        if (rows) cJSON_Delete(rows);
        send_json_error(res, 401, "Invalid admin username or password");
        return;
    }

    cJSON *admin_obj = cJSON_DetachItemFromArray(rows, 0);
    cJSON_Delete(rows);

    cJSON *id_item = cJSON_GetObjectItemCaseSensitive(admin_obj, "id");
    int admin_id = id_item ? id_item->valueint : 0;

    char *token = auth_generate_token(admin_id, 1);

    cJSON *resp_data = cJSON_CreateObject();
    cJSON_AddStringToObject(resp_data, "token", token);
    cJSON_AddItemToObject(resp_data, "user", admin_obj);
    free(token);

    send_json_success(res, "Admin login successful", resp_data);
}

void handle_rooms_list(const HttpRequest *req, HttpResponse *res) {
    (void)req;
    cJSON *rows = db_query_json(
        "SELECT r.id, r.block_id, hb.block_name, r.room_number, r.floor, r.room_type, r.capacity, r.occupied_count, r.status "
        "FROM rooms r "
        "JOIN hostel_blocks hb ON r.block_id = hb.id "
        "ORDER BY hb.block_name, r.floor, r.room_number",
        NULL, 0
    );
    send_json_response(res, 200, rows ? rows : cJSON_CreateArray());
}

void handle_rooms_add(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *block = cJSON_GetObjectItemCaseSensitive(json, "block_id");
    cJSON *number = cJSON_GetObjectItemCaseSensitive(json, "room_number");
    cJSON *floor = cJSON_GetObjectItemCaseSensitive(json, "floor");
    cJSON *type = cJSON_GetObjectItemCaseSensitive(json, "room_type");
    cJSON *cap = cJSON_GetObjectItemCaseSensitive(json, "capacity");

    if (!block || !number || !floor || !type || !cap) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing required fields");
        return;
    }

    char block_str[16], floor_str[16], cap_str[16];
    snprintf(block_str, sizeof(block_str), "%d", cJSON_IsNumber(block) ? block->valueint : atoi(block->valuestring));
    snprintf(floor_str, sizeof(floor_str), "%d", cJSON_IsNumber(floor) ? floor->valueint : atoi(floor->valuestring));
    snprintf(cap_str, sizeof(cap_str), "%d", cJSON_IsNumber(cap) ? cap->valueint : atoi(cap->valuestring));

    const char *params[5] = {
        block_str,
        cJSON_IsString(number) ? number->valuestring : "",
        floor_str,
        cJSON_IsString(type) ? type->valuestring : "double",
        cap_str
    };

    int ret = db_execute_params(
        "INSERT INTO rooms (block_id, room_number, floor, room_type, capacity, occupied_count, status) VALUES (?, ?, ?, ?, ?, 0, 'available')",
        params, 5
    );

    cJSON_Delete(json);

    if (ret != 0) {
        send_json_error(res, 400, "Failed to add room. Room number may already exist in this block.");
        return;
    }

    send_json_success(res, "Room added successfully", NULL);
}

void handle_rooms_update(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    const char *p = strrchr(req->path, '/');
    int room_id = (p && atoi(p + 1) > 0) ? atoi(p + 1) : 0;
    if (!room_id) {
        send_json_error(res, 400, "Invalid room ID");
        return;
    }

    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *number = cJSON_GetObjectItemCaseSensitive(json, "room_number");
    cJSON *type = cJSON_GetObjectItemCaseSensitive(json, "room_type");
    cJSON *cap = cJSON_GetObjectItemCaseSensitive(json, "capacity");
    cJSON *status = cJSON_GetObjectItemCaseSensitive(json, "status");

    char room_id_str[16];
    snprintf(room_id_str, sizeof(room_id_str), "%d", room_id);

    if (status && cJSON_IsString(status)) {
        const char *params[2] = { status->valuestring, room_id_str };
        db_execute_params("UPDATE rooms SET status = ? WHERE id = ?", params, 2);
    }
    if (number && cJSON_IsString(number)) {
        const char *params[2] = { number->valuestring, room_id_str };
        db_execute_params("UPDATE rooms SET room_number = ? WHERE id = ?", params, 2);
    }
    if (type && cJSON_IsString(type)) {
        const char *params[2] = { type->valuestring, room_id_str };
        db_execute_params("UPDATE rooms SET room_type = ? WHERE id = ?", params, 2);
    }
    if (cap && (cJSON_IsNumber(cap) || cJSON_IsString(cap))) {
        char cap_str[16];
        snprintf(cap_str, sizeof(cap_str), "%d", cJSON_IsNumber(cap) ? cap->valueint : atoi(cap->valuestring));
        const char *params[2] = { cap_str, room_id_str };
        db_execute_params("UPDATE rooms SET capacity = ? WHERE id = ?", params, 2);
    }

    cJSON_Delete(json);
    send_json_success(res, "Room updated successfully", NULL);
}

void handle_rooms_delete(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    const char *p = strrchr(req->path, '/');
    int room_id = (p && atoi(p + 1) > 0) ? atoi(p + 1) : 0;
    if (!room_id) {
        send_json_error(res, 400, "Invalid room ID");
        return;
    }

    char id_str[16];
    snprintf(id_str, sizeof(id_str), "%d", room_id);
    const char *params[1] = { id_str };

    int ret = db_execute_params("DELETE FROM rooms WHERE id = ? AND occupied_count = 0", params, 1);
    if (ret != 0) {
        send_json_error(res, 400, "Cannot delete room with active occupants or allotments.");
        return;
    }

    send_json_success(res, "Room deleted successfully", NULL);
}

void handle_applications_list(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    cJSON *rows = db_query_json(
        "SELECT a.id, s.name as student_name, s.student_id, s.department, s.year, "
        "hb.block_name as preferred_block, a.preferred_room_type, a.status, a.applied_on "
        "FROM applications a "
        "JOIN students s ON a.student_id = s.id "
        "LEFT JOIN hostel_blocks hb ON a.preferred_block = hb.id "
        "ORDER BY a.id DESC",
        NULL, 0
    );

    send_json_response(res, 200, rows ? rows : cJSON_CreateArray());
}

void handle_application_status_update(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    const char *p = strrchr(req->path, '/');
    int app_id = (p && atoi(p + 1) > 0) ? atoi(p + 1) : 0;
    if (!app_id) {
        send_json_error(res, 400, "Invalid application ID");
        return;
    }

    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *status = cJSON_GetObjectItemCaseSensitive(json, "status");
    if (!status || !cJSON_IsString(status)) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing status string");
        return;
    }

    char app_id_str[16];
    snprintf(app_id_str, sizeof(app_id_str), "%d", app_id);
    const char *params[2] = { status->valuestring, app_id_str };

    db_execute_params("UPDATE applications SET status = ? WHERE id = ?", params, 2);
    cJSON_Delete(json);

    send_json_success(res, "Application status updated", NULL);
}

void handle_allotment_auto(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    if (!auth_get_user_id(req, &is_admin) || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    cJSON *summary = allotment_auto_run();
    send_json_success(res, "Auto allotment completed", summary);
}

void handle_allotment_manual(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    int admin_id = auth_get_user_id(req, &is_admin);
    if (!admin_id || !is_admin) {
        send_json_error(res, 401, "Admin authorization required");
        return;
    }

    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *stu_item = cJSON_GetObjectItemCaseSensitive(json, "student_id");
    cJSON *room_item = cJSON_GetObjectItemCaseSensitive(json, "room_id");

    if (!stu_item || !room_item) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing student_id or room_id");
        return;
    }

    int student_id = cJSON_IsNumber(stu_item) ? stu_item->valueint : atoi(stu_item->valuestring);
    int room_id = cJSON_IsNumber(room_item) ? room_item->valueint : atoi(room_item->valuestring);

    cJSON_Delete(json);

    int ret = allotment_manual_assign(student_id, room_id, "admin");
    if (ret != 0) {
        send_json_error(res, 400, "Manual allotment failed. Room may be full or student invalid.");
        return;
    }

    send_json_success(res, "Manual room allotment successful", NULL);
}

void handle_reports_occupancy(const HttpRequest *req, HttpResponse *res) {
    (void)req;
    cJSON *rows = db_query_json(
        "SELECT hb.block_name, COUNT(r.id) as total_rooms, SUM(r.capacity) as total_capacity, SUM(r.occupied_count) as occupied, (SUM(r.capacity) - SUM(r.occupied_count)) as vacant "
        "FROM hostel_blocks hb "
        "LEFT JOIN rooms r ON hb.id = r.block_id "
        "GROUP BY hb.id",
        NULL, 0
    );
    send_json_response(res, 200, rows ? rows : cJSON_CreateArray());
}

void handle_reports_vacant(const HttpRequest *req, HttpResponse *res) {
    (void)req;
    cJSON *rows = db_query_json(
        "SELECT r.id, r.room_number, hb.block_name, r.floor, r.room_type, r.capacity, r.occupied_count, (r.capacity - r.occupied_count) as vacant_spots "
        "FROM rooms r "
        "JOIN hostel_blocks hb ON r.block_id = hb.id "
        "WHERE r.occupied_count < r.capacity "
        "ORDER BY hb.block_name, r.floor, r.room_number",
        NULL, 0
    );
    send_json_response(res, 200, rows ? rows : cJSON_CreateArray());
}

void handle_dashboard_stats(const HttpRequest *req, HttpResponse *res) {
    (void)req;
    int total_rooms = db_query_int("SELECT COUNT(*) FROM rooms", NULL, 0);
    int occupied_rooms = db_query_int("SELECT COUNT(*) FROM rooms WHERE occupied_count > 0", NULL, 0);
    int vacant_rooms = db_query_int("SELECT COUNT(*) FROM rooms WHERE occupied_count < capacity", NULL, 0);
    int pending_apps = db_query_int("SELECT COUNT(*) FROM applications WHERE status = 'pending'", NULL, 0);
    int total_students = db_query_int("SELECT COUNT(*) FROM students", NULL, 0);

    cJSON *stats = cJSON_CreateObject();
    cJSON_AddNumberToObject(stats, "total_rooms", total_rooms);
    cJSON_AddNumberToObject(stats, "occupied_rooms", occupied_rooms);
    cJSON_AddNumberToObject(stats, "vacant_rooms", vacant_rooms);
    cJSON_AddNumberToObject(stats, "pending_applications", pending_apps);
    cJSON_AddNumberToObject(stats, "total_students", total_students);

    send_json_response(res, 200, stats);
}
