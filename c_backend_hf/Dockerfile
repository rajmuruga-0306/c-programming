FROM gcc:latest

RUN apt-get update && apt-get install -y \
    libmicrohttpd-dev \
    make \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user (HF Spaces requirement)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user

WORKDIR /home/user/app

COPY --chown=user:user backend/ /home/user/app/backend/
COPY --chown=user:user database/ /home/user/app/database/

WORKDIR /home/user/app/backend

# Create Linux Makefile on the fly (original is Windows-specific)
RUN echo 'CC = gcc' > Makefile && \
    echo 'CFLAGS = -Wall -Wextra -g -Isrc -Ilib -pthread' >> Makefile && \
    echo 'LDFLAGS = -lmicrohttpd -lpthread -lm -ldl' >> Makefile && \
    echo '' >> Makefile && \
    echo 'SRCS = src/main.c src/routes.c src/db.c src/auth.c src/sha256.c \\' >> Makefile && \
    echo '       src/config.c src/json_utils.c src/handlers_student.c \\' >> Makefile && \
    echo '       src/handlers_admin.c src/allotment.c src/http_server.c \\' >> Makefile && \
    echo '       lib/cJSON.c lib/sqlite3.c' >> Makefile && \
    echo '' >> Makefile && \
    echo 'OBJS = $(SRCS:.c=.o)' >> Makefile && \
    echo 'TARGET = hostel_server' >> Makefile && \
    echo '' >> Makefile && \
    echo 'all: $(TARGET)' >> Makefile && \
    echo '' >> Makefile && \
    echo '$(TARGET): $(OBJS)' >> Makefile && \
    printf '\t$(CC) $(OBJS) -o $$@ $(LDFLAGS)\n' >> Makefile && \
    echo '' >> Makefile && \
    echo 'clean:' >> Makefile && \
    printf '\trm -f $(OBJS) $(TARGET)\n' >> Makefile && \
    echo '' >> Makefile && \
    echo '.PHONY: all clean' >> Makefile

RUN make clean 2>/dev/null; make -j$(nproc)

# Create writable database directory
RUN mkdir -p /home/user/app/database

EXPOSE 7860

ENV PORT=7860

WORKDIR /home/user/app/backend
CMD ["./hostel_server"]
