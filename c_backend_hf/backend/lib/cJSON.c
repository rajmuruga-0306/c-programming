#include "cJSON.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <ctype.h>
#include <math.h>

static void *(*cJSON_malloc)(size_t sz) = malloc;
static void (*cJSON_free)(void *ptr) = free;

static char* cJSON_strdup(const char* str) {
    size_t len;
    char* copy;
    if (!str) return NULL;
    len = strlen(str) + 1;
    copy = (char*)cJSON_malloc(len);
    if (copy) memcpy(copy, str, len);
    return copy;
}

cJSON *cJSON_CreateNull(void) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_NULL; } return item; }
cJSON *cJSON_CreateTrue(void) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_True; } return item; }
cJSON *cJSON_CreateFalse(void) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_False; } return item; }
cJSON *cJSON_CreateBool(int boolean) { return boolean ? cJSON_CreateTrue() : cJSON_CreateFalse(); }
cJSON *cJSON_CreateNumber(double num) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_Number; item->valuedouble = num; item->valueint = (int)num; } return item; }
cJSON *cJSON_CreateString(const char *string) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_String; item->valuestring = cJSON_strdup(string); } return item; }
cJSON *cJSON_CreateArray(void) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_Array; } return item; }
cJSON *cJSON_CreateObject(void) { cJSON *item = (cJSON*)cJSON_malloc(sizeof(cJSON)); if(item) { memset(item, 0, sizeof(cJSON)); item->type = cJSON_Object; } return item; }

void cJSON_Delete(cJSON *item) {
    cJSON *next;
    while (item) {
        next = item->next;
        if (!(item->type & cJSON_String) && item->child) cJSON_Delete(item->child);
        if (item->valuestring) cJSON_free(item->valuestring);
        if (item->string) cJSON_free(item->string);
        cJSON_free(item);
        item = next;
    }
}

void cJSON_AddItemToArray(cJSON *array, cJSON *item) {
    cJSON *c;
    if (!item) return;
    if (!array->child) { array->child = item; }
    else { c = array->child; while (c->next) c = c->next; c->next = item; item->prev = c; }
}

void cJSON_AddItemToObject(cJSON *object, const char *string, cJSON *item) {
    if (!item) return;
    if (item->string) cJSON_free(item->string);
    item->string = cJSON_strdup(string);
    cJSON_AddItemToArray(object, item);
}

cJSON *cJSON_DetachItemFromArray(cJSON *array, int which) {
    cJSON *c;
    if (!array) return NULL;
    c = array->child;
    while (c && which > 0) {
        c = c->next;
        which--;
    }
    if (!c) return NULL;
    if (c->prev) c->prev->next = c->next;
    if (c->next) c->next->prev = c->prev;
    if (c == array->child) array->child = c->next;
    c->prev = NULL;
    c->next = NULL;
    return c;
}

void cJSON_DeleteItemFromArray(cJSON *array, int which) {
    cJSON_Delete(cJSON_DetachItemFromArray(array, which));
}

cJSON *cJSON_DetachItemFromObject(cJSON *object, const char *string) {
    int i = 0;
    cJSON *c;
    if (!object || !string) return NULL;
    c = object->child;
    while (c && strcmp(c->string, string) != 0) {
        i++;
        c = c->next;
    }
    if (c) return cJSON_DetachItemFromArray(object, i);
    return NULL;
}

void cJSON_DeleteItemFromObject(cJSON *object, const char *string) {
    cJSON_Delete(cJSON_DetachItemFromObject(object, string));
}

cJSON *cJSON_AddNullToObject(cJSON * const object, const char * const name) { cJSON *n = cJSON_CreateNull(); cJSON_AddItemToObject(object, name, n); return n; }
cJSON *cJSON_AddTrueToObject(cJSON * const object, const char * const name) { cJSON *n = cJSON_CreateTrue(); cJSON_AddItemToObject(object, name, n); return n; }
cJSON *cJSON_AddFalseToObject(cJSON * const object, const char * const name) { cJSON *n = cJSON_CreateFalse(); cJSON_AddItemToObject(object, name, n); return n; }
cJSON *cJSON_AddBoolToObject(cJSON * const object, const char * const name, const int boolean) { cJSON *n = cJSON_CreateBool(boolean); cJSON_AddItemToObject(object, name, n); return n; }
cJSON *cJSON_AddNumberToObject(cJSON * const object, const char * const name, const double number) { cJSON *n = cJSON_CreateNumber(number); cJSON_AddItemToObject(object, name, n); return n; }
cJSON *cJSON_AddStringToObject(cJSON * const object, const char * const name, const char * const string) { cJSON *n = cJSON_CreateString(string); cJSON_AddItemToObject(object, name, n); return n; }

int cJSON_GetArraySize(const cJSON *array) { cJSON *c = array->child; int i = 0; while (c) { i++; c = c->next; } return i; }
cJSON *cJSON_GetArrayItem(const cJSON *array, int index) { cJSON *c = array->child; while (c && index > 0) { index--; c = c->next; } return c; }
cJSON *cJSON_GetObjectItemCaseSensitive(const cJSON *object, const char *string) { cJSON *c = object->child; while (c && strcmp(c->string, string) != 0) c = c->next; return c; }

int cJSON_IsInvalid(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_Invalid); }
int cJSON_IsFalse(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_False); }
int cJSON_IsTrue(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_True); }
int cJSON_IsBool(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_True || item->type == cJSON_False); }
int cJSON_IsNull(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_NULL); }
int cJSON_IsNumber(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_Number); }
int cJSON_IsString(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_String); }
int cJSON_IsArray(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_Array); }
int cJSON_IsObject(const cJSON * const item) { return item == NULL ? 0 : (item->type == cJSON_Object); }

static const char *parse_value(cJSON *item, const char *value);

static const char *skip(const char *in) { while (in && *in && (unsigned char)*in <= 32) in++; return in; }

cJSON *cJSON_Parse(const char *value) {
    const char *end;
    cJSON *c = cJSON_CreateNull();
    if (!c) return NULL;
    end = parse_value(c, skip(value));
    if (!end) { cJSON_Delete(c); return NULL; }
    return c;
}

static const char *parse_string(cJSON *item, const char *str) {
    const char *ptr = str + 1; char *ptr2; char *out; int len = 0; if (*str != '\"') return 0;
    while (*ptr != '\"' && *ptr) { ++len; if (*ptr++ == '\\') ptr++; }
    out = (char*)cJSON_malloc(len + 1); if (!out) return 0;
    ptr = str + 1; ptr2 = out;
    while (*ptr != '\"' && *ptr) {
        if (*ptr != '\\') *ptr2++ = *ptr++;
        else { ptr++; switch (*ptr) { case 'b': *ptr2++ = '\b'; break; case 'f': *ptr2++ = '\f'; break; case 'n': *ptr2++ = '\n'; break; case 'r': *ptr2++ = '\r'; break; case 't': *ptr2++ = '\t'; break; default: *ptr2++ = *ptr; break; } ptr++; }
    }
    *ptr2 = 0; if (*ptr == '\"') ptr++; item->valuestring = out; item->type = cJSON_String; return ptr;
}

static const char *parse_number(cJSON *item, const char *num) {
    double n = 0, sign = 1, scale = 0; int subscale = 0, signsubscale = 1;
    if (*num == '-') { sign = -1; num++; }
    if (*num == '0') num++; else if (*num >= '1' && *num <= '9') { do n = (n * 10.0) + (*num++ - '0'); while (*num >= '0' && *num <= '9'); }
    if (*num == '.' && num[1] >= '0' && num[1] <= '9') { num++; do { n = (n * 10.0) + (*num++ - '0'); scale--; } while (*num >= '0' && *num <= '9'); }
    if (*num == 'e' || *num == 'E') { num++; if (*num == '+') num++; else if (*num == '-') { signsubscale = -1; num++; } while (*num >= '0' && *num <= '9') subscale = (subscale * 10) + (*num++ - '0'); }
    n = sign * n * pow(10.0, (scale + subscale * signsubscale));
    item->valuedouble = n; item->valueint = (int)n; item->type = cJSON_Number; return num;
}

static const char *parse_array(cJSON *item, const char *value) {
    cJSON *child; if (*value != '[') return 0;
    item->type = cJSON_Array; value = skip(value + 1);
    if (*value == ']') return value + 1;
    item->child = child = cJSON_CreateNull();
    value = skip(parse_value(child, skip(value))); if (!value) return 0;
    while (*value == ',') {
        cJSON *new_item = cJSON_CreateNull(); child->next = new_item; new_item->prev = child; child = new_item;
        value = skip(parse_value(child, skip(value + 1))); if (!value) return 0;
    }
    if (*value == ']') return value + 1; return 0;
}

static const char *parse_object(cJSON *item, const char *value) {
    cJSON *child; if (*value != '{') return 0;
    item->type = cJSON_Object; value = skip(value + 1);
    if (*value == '}') return value + 1;
    item->child = child = cJSON_CreateNull();
    value = skip(parse_string(child, skip(value))); if (!value || *value != ':') return 0;
    child->string = child->valuestring; child->valuestring = 0; child->type = cJSON_NULL;
    value = skip(parse_value(child, skip(value + 1))); if (!value) return 0;
    while (*value == ',') {
        cJSON *new_item = cJSON_CreateNull(); child->next = new_item; new_item->prev = child; child = new_item;
        value = skip(parse_string(child, skip(value + 1))); if (!value || *value != ':') return 0;
        child->string = child->valuestring; child->valuestring = 0; child->type = cJSON_NULL;
        value = skip(parse_value(child, skip(value + 1))); if (!value) return 0;
    }
    if (*value == '}') return value + 1; return 0;
}

static const char *parse_value(cJSON *item, const char *value) {
    if (!value) return 0;
    if (!strncmp(value, "null", 4)) { item->type = cJSON_NULL; return value + 4; }
    if (!strncmp(value, "false", 5)) { item->type = cJSON_False; return value + 5; }
    if (!strncmp(value, "true", 4)) { item->type = cJSON_True; item->valueint = 1; return value + 4; }
    if (*value == '\"') return parse_string(item, value);
    if (*value == '-' || (*value >= '0' && *value <= '9')) return parse_number(item, value);
    if (*value == '[') return parse_array(item, value);
    if (*value == '{') return parse_object(item, value);
    return 0;
}

static char *print_value(const cJSON *item, int depth, int fmt);

static char *print_string(const char *str) {
    const char *ptr = str; char *ptr2, *out; int len = 0;
    if (!str) return cJSON_strdup("");
    while (*ptr) { if ((unsigned char)*ptr < 32 || *ptr == '\"' || *ptr == '\\') len += 2; else len++; ptr++; }
    out = (char*)cJSON_malloc(len + 3); ptr2 = out; *ptr2++ = '\"'; ptr = str;
    while (*ptr) {
        if ((unsigned char)*ptr < 32 || *ptr == '\"' || *ptr == '\\') {
            *ptr2++ = '\\';
            switch (*ptr) { case '\b': *ptr2++ = 'b'; break; case '\f': *ptr2++ = 'f'; break; case '\n': *ptr2++ = 'n'; break; case '\r': *ptr2++ = 'r'; break; case '\t': *ptr2++ = 't'; break; case '\"': *ptr2++ = '\"'; break; case '\\': *ptr2++ = '\\'; break; default: *ptr2++ = 'u'; break; }
        } else *ptr2++ = *ptr;
        ptr++;
    }
    *ptr2++ = '\"'; *ptr2++ = 0; return out;
}

static char *print_number(const cJSON *item) {
    char *str = (char*)cJSON_malloc(64);
    if (item->valuedouble == (double)item->valueint) sprintf(str, "%d", item->valueint);
    else sprintf(str, "%f", item->valuedouble);
    return str;
}

static char *print_array(const cJSON *item, int depth, int fmt) {
    char **entries; char *out = 0, *ptr, *ret; int len = 5, i = 0, fail = 0;
    cJSON *child = item->child; int numentries = cJSON_GetArraySize(item);
    if (!numentries) return cJSON_strdup("[]");
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    while (child) {
        ret = print_value(child, depth + 1, fmt); entries[i++] = ret; if (ret) len += strlen(ret) + 2 + (fmt ? 1 : 0); else fail = 1;
        child = child->next;
    }
    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;
    if (fail) { for (i = 0; i < numentries; i++) if (entries[i]) cJSON_free(entries[i]); cJSON_free(entries); return 0; }
    *out = '['; ptr = out + 1; *ptr = 0;
    for (i = 0; i < numentries; i++) {
        strcpy(ptr, entries[i]); ptr += strlen(entries[i]);
        if (i != numentries - 1) { *ptr++ = ','; if (fmt) *ptr++ = ' '; *ptr = 0; }
        cJSON_free(entries[i]);
    }
    cJSON_free(entries); *ptr++ = ']'; *ptr++ = 0; return out;
}

static char *print_object(const cJSON *item, int depth, int fmt) {
    char **entries = 0, **names = 0; char *out = 0, *ptr, *ret, *str; int len = 7, i = 0, fail = 0;
    cJSON *child = item->child; int numentries = cJSON_GetArraySize(item);
    if (!numentries) return cJSON_strdup("{}");
    entries = (char**)cJSON_malloc(numentries * sizeof(char*));
    names = (char**)cJSON_malloc(numentries * sizeof(char*));
    while (child) {
        names[i] = str = print_string(child->string); entries[i++] = ret = print_value(child, depth + 1, fmt);
        if (str && ret) len += strlen(ret) + strlen(str) + 2 + (fmt ? 2 + depth : 0); else fail = 1;
        child = child->next;
    }
    if (!fail) out = (char*)cJSON_malloc(len);
    if (!out) fail = 1;
    if (fail) { for (i = 0; i < numentries; i++) { if (names && names[i]) cJSON_free(names[i]); if (entries && entries[i]) cJSON_free(entries[i]); } cJSON_free(names); cJSON_free(entries); return 0; }
    *out = '{'; ptr = out + 1; if (fmt) *ptr++ = '\n'; *ptr = 0;
    for (i = 0; i < numentries; i++) {
        if (fmt) { int j; for (j = 0; j < depth; j++) *ptr++ = '\t'; }
        strcpy(ptr, names[i]); ptr += strlen(names[i]); *ptr++ = ':'; if (fmt) *ptr++ = '\t';
        strcpy(ptr, entries[i]); ptr += strlen(entries[i]);
        if (i != numentries - 1) *ptr++ = ',';
        if (fmt) *ptr++ = '\n'; *ptr = 0;
        cJSON_free(names[i]); cJSON_free(entries[i]);
    }
    cJSON_free(names); cJSON_free(entries);
    if (fmt) { int j; for (j = 0; j < depth - 1; j++) *ptr++ = '\t'; }
    *ptr++ = '}'; *ptr++ = 0; return out;
}

static char *print_value(const cJSON *item, int depth, int fmt) {
    if (!item) return 0;
    switch ((item->type) & 255) {
        case cJSON_NULL: return cJSON_strdup("null");
        case cJSON_False: return cJSON_strdup("false");
        case cJSON_True: return cJSON_strdup("true");
        case cJSON_Number: return print_number(item);
        case cJSON_String: return print_string(item->valuestring);
        case cJSON_Array: return print_array(item, depth, fmt);
        case cJSON_Object: return print_object(item, depth, fmt);
    }
    return 0;
}

char *cJSON_Print(const cJSON *item) { return print_value(item, 1, 1); }
char *cJSON_PrintUnformatted(const cJSON *item) { return print_value(item, 0, 0); }
