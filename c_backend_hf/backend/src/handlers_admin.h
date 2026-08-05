#ifndef HANDLERS_ADMIN_H
#define HANDLERS_ADMIN_H

#include "http_server.h"

void handle_admin_login(const HttpRequest *req, HttpResponse *res);
void handle_rooms_list(const HttpRequest *req, HttpResponse *res);
void handle_rooms_add(const HttpRequest *req, HttpResponse *res);
void handle_rooms_update(const HttpRequest *req, HttpResponse *res);
void handle_rooms_delete(const HttpRequest *req, HttpResponse *res);
void handle_applications_list(const HttpRequest *req, HttpResponse *res);
void handle_application_status_update(const HttpRequest *req, HttpResponse *res);
void handle_allotment_auto(const HttpRequest *req, HttpResponse *res);
void handle_allotment_manual(const HttpRequest *req, HttpResponse *res);
void handle_reports_occupancy(const HttpRequest *req, HttpResponse *res);
void handle_reports_vacant(const HttpRequest *req, HttpResponse *res);
void handle_dashboard_stats(const HttpRequest *req, HttpResponse *res);

#endif
