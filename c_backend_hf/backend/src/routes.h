#ifndef ROUTES_H
#define ROUTES_H

#include "http_server.h"

void route_dispatch(const HttpRequest *req, HttpResponse *res);

#endif
