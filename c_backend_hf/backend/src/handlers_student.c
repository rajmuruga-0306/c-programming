#include "handlers_student.h"
#include "db.h"
#include "auth.h"
#include "sha256.h"
#include "json_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_student_register(const HttpRequest *req, HttpResponse *res) {
    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *name = cJSON_GetObjectItemCaseSensitive(json, "name");
    cJSON *email = cJSON_GetObjectItemCaseSensitive(json, "email");
    cJSON *pass = cJSON_GetObjectItemCaseSensitive(json, "password");
    cJSON *stu_id = cJSON_GetObjectItemCaseSensitive(json, "student_id");
    cJSON *dept = cJSON_GetObjectItemCaseSensitive(json, "department");
    cJSON *year = cJSON_GetObjectItemCaseSensitive(json, "year");
    cJSON *phone = cJSON_GetObjectItemCaseSensitive(json, "phone");

    if (!name || !email || !pass || !stu_id || !cJSON_IsString(name) || !cJSON_IsString(email) || !cJSON_IsString(pass) || !cJSON_IsString(stu_id)) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing required fields: name, email, password, student_id");
        return;
    }

    char pass_hash[65];
    sha256_hash(pass->valuestring, pass_hash);

    char year_str[16] = "1";
    if (year && cJSON_IsNumber(year)) {
        snprintf(year_str, sizeof(year_str), "%d", year->valueint);
    } else if (year && cJSON_IsString(year)) {
        strncpy(year_str, year->valuestring, sizeof(year_str)-1);
    }

    const char *params[7] = {
        name->valuestring,
        email->valuestring,
        pass_hash,
        stu_id->valuestring,
        (dept && dept->valuestring) ? dept->valuestring : "",
        year_str,
        (phone && phone->valuestring) ? phone->valuestring : ""
    };

    int ret = db_execute_params(
        "INSERT INTO students (name, email, password_hash, student_id, department, year, phone) VALUES (?, ?, ?, ?, ?, ?, ?)",
        params, 7
    );

    cJSON_Delete(json);

    if (ret != 0) {
        send_json_error(res, 400, "Student registration failed. Email or Student ID may already exist.");
        return;
    }

    send_json_success(res, "Student registered successfully!", NULL);
}

void handle_student_login(const HttpRequest *req, HttpResponse *res) {
    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    cJSON *email = cJSON_GetObjectItemCaseSensitive(json, "email");
    cJSON *pass = cJSON_GetObjectItemCaseSensitive(json, "password");

    if (!email || !pass || !cJSON_IsString(email) || !cJSON_IsString(pass)) {
        cJSON_Delete(json);
        send_json_error(res, 400, "Missing email or password");
        return;
    }

    char pass_hash[65];
    sha256_hash(pass->valuestring, pass_hash);

    const char *params[2] = { email->valuestring, pass_hash };
    cJSON *rows = db_query_json(
        "SELECT id, name, email, student_id, department, year, phone FROM students WHERE email = ? AND password_hash = ?",
        params, 2
    );

    cJSON_Delete(json);

    if (!rows || cJSON_GetArraySize(rows) == 0) {
        if (rows) cJSON_Delete(rows);
        send_json_error(res, 401, "Invalid email or password");
        return;
    }

    cJSON *user_obj = cJSON_DetachItemFromArray(rows, 0);
    cJSON_Delete(rows);

    cJSON *id_item = cJSON_GetObjectItemCaseSensitive(user_obj, "id");
    int user_id = id_item ? id_item->valueint : 0;

    char *token = auth_generate_token(user_id, 0);

    cJSON *resp_data = cJSON_CreateObject();
    cJSON_AddStringToObject(resp_data, "token", token);
    cJSON_AddItemToObject(resp_data, "user", user_obj);
    free(token);

    send_json_success(res, "Login successful", resp_data);
}

void handle_application_submit(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    int user_id = auth_get_user_id(req, &is_admin);
    if (!user_id || is_admin) {
        send_json_error(res, 401, "Student authentication required");
        return;
    }

    cJSON *json = cJSON_Parse(req->body);
    if (!json) {
        send_json_error(res, 400, "Invalid JSON body");
        return;
    }

    // Check existing pending application
    char uid_str[32];
    snprintf(uid_str, sizeof(uid_str), "%d", user_id);
    const char *chk_params[1] = { uid_str };
    int pending_count = db_query_int("SELECT COUNT(*) FROM applications WHERE student_id = ? AND status = 'pending'", chk_params, 1);
    if (pending_count > 0) {
        cJSON_Delete(json);
        send_json_error(res, 400, "You already have a pending application.");
        return;
    }

    cJSON *block = cJSON_GetObjectItemCaseSensitive(json, "preferred_block");
    cJSON *type = cJSON_GetObjectItemCaseSensitive(json, "preferred_room_type");
    cJSON *floor = cJSON_GetObjectItemCaseSensitive(json, "floor_preference");
    cJSON *roommate = cJSON_GetObjectItemCaseSensitive(json, "roommate_preference");

    char block_str[64] = "1";
    if (block) {
        if (cJSON_IsNumber(block)) snprintf(block_str, sizeof(block_str), "%d", block->valueint);
        else if (cJSON_IsString(block)) strncpy(block_str, block->valuestring, sizeof(block_str)-1);
    }

    char floor_str[16] = "0";
    if (floor && cJSON_IsNumber(floor)) snprintf(floor_str, sizeof(floor_str), "%d", floor->valueint);

    const char *params[5] = {
        uid_str,
        block_str,
        (type && type->valuestring) ? type->valuestring : "double",
        floor_str,
        (roommate && roommate->valuestring) ? roommate->valuestring : ""
    };

    int ret = db_execute_params(
        "INSERT INTO applications (student_id, preferred_block, preferred_room_type, floor_preference, roommate_preference, status) VALUES (?, ?, ?, ?, ?, 'pending')",
        params, 5
    );

    cJSON_Delete(json);

    if (ret != 0) {
        send_json_error(res, 500, "Failed to submit application");
        return;
    }

    send_json_success(res, "Application submitted successfully", NULL);
}

void handle_application_status(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    int user_id = auth_get_user_id(req, &is_admin);
    
    // Extract student_id from path if present: /api/application/status/12
    const char *p = strrchr(req->path, '/');
    if (p && atoi(p + 1) > 0) {
        user_id = atoi(p + 1);
    }

    if (!user_id) {
        send_json_error(res, 401, "Authentication required");
        return;
    }

    char uid_str[32];
    snprintf(uid_str, sizeof(uid_str), "%d", user_id);
    const char *params[1] = { uid_str };

    cJSON *rows = db_query_json(
        "SELECT a.id, a.student_id, hb.block_name as preferred_block, a.preferred_room_type, a.floor_preference, a.roommate_preference, a.status, a.applied_on as created_at "
        "FROM applications a "
        "LEFT JOIN hostel_blocks hb ON a.preferred_block = hb.id "
        "WHERE a.student_id = ? ORDER BY a.id DESC LIMIT 1",
        params, 1
    );

    if (!rows || cJSON_GetArraySize(rows) == 0) {
        if (rows) cJSON_Delete(rows);
        send_json_error(res, 404, "No application found");
        return;
    }

    cJSON *app_obj = cJSON_DetachItemFromArray(rows, 0);
    cJSON_Delete(rows);
    send_json_response(res, 200, app_obj);
}

void handle_allotment_get(const HttpRequest *req, HttpResponse *res) {
    int is_admin = 0;
    int user_id = auth_get_user_id(req, &is_admin);

    const char *p = strrchr(req->path, '/');
    if (p && atoi(p + 1) > 0) {
        user_id = atoi(p + 1);
    }

    if (!user_id) {
        send_json_error(res, 401, "Authentication required");
        return;
    }

    char uid_str[32];
    snprintf(uid_str, sizeof(uid_str), "%d", user_id);
    const char *params[1] = { uid_str };

    cJSON *rows = db_query_json(
        "SELECT al.id, al.allotted_on as allotted_at, r.room_number, r.floor, r.room_type, hb.block_name "
        "FROM allotments al "
        "JOIN rooms r ON al.room_id = r.id "
        "JOIN hostel_blocks hb ON r.block_id = hb.id "
        "WHERE al.student_id = ? ORDER BY al.id DESC LIMIT 1",
        params, 1
    );

    if (!rows || cJSON_GetArraySize(rows) == 0) {
        if (rows) cJSON_Delete(rows);
        send_json_error(res, 404, "No active allotment found");
        return;
    }

    cJSON *alt_obj = cJSON_DetachItemFromArray(rows, 0);
    cJSON_Delete(rows);
    send_json_response(res, 200, alt_obj);
}

void handle_hostel_blocks_list(const HttpRequest *req, HttpResponse *res) {
    (void)req;
    cJSON *rows = db_query_json("SELECT id, block_name as name, total_floors FROM hostel_blocks ORDER BY id", NULL, 0);
    send_json_response(res, 200, rows ? rows : cJSON_CreateArray());
}
