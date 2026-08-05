#ifndef ALLOTMENT_H
#define ALLOTMENT_H

#include "../lib/cJSON.h"

cJSON *allotment_auto_run(void);
int allotment_manual_assign(int student_id, int room_id, const char *admin_username);

#endif
