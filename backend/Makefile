CC = gcc
CFLAGS = -Wall -Wextra -g -Isrc -Ilib
LDFLAGS = -lws2_32

SRCS = src/main.c src/routes.c src/db.c src/auth.c src/sha256.c \
       src/config.c src/json_utils.c src/handlers_student.c \
       src/handlers_admin.c src/allotment.c src/http_server.c \
       lib/cJSON.c lib/sqlite3.c

OBJS = $(SRCS:.c=.o)
TARGET = hostel_server.exe

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $@ $(LDFLAGS)

clean:
	del /f /q src\*.o lib\*.o $(TARGET) 2>NUL || rm -f $(OBJS) $(TARGET)

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run
