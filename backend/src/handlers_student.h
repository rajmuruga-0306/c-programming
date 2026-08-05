#ifndef HANDLERS_STUDENT_H
#define HANDLERS_STUDENT_H

#include "http_server.h"

void handle_student_register(const HttpRequest *req, HttpResponse *res);
void handle_student_login(const HttpRequest *req, HttpResponse *res);
void handle_application_submit(const HttpRequest *req, HttpResponse *res);
void handle_application_status(const HttpRequest *req, HttpResponse *res);
void handle_allotment_get(const HttpRequest *req, HttpResponse *res);
void handle_hostel_blocks_list(const HttpRequest *req, HttpResponse *res);

#endif
