#include "sha256.h"
#include <stdint.h>
#include <string.h>
#include <stdio.h>

#define ROTRIGHT(word,bits) (((word) >> (bits)) | ((word) << (32-(bits))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
#define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))
#define SIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))

static const uint32_t k[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static void transform(uint32_t state[8], const uint8_t data[64]) {
    uint32_t m[64];
    uint32_t a,b,c,d,e,f,g,h,i,t1,t2;

    for (i = 0; i < 16; ++i)
        m[i] = (data[i*4] << 24) | (data[i*4+1] << 16) | (data[i*4+2] << 8) | (data[i*4+3]);
    for (i = 16; i < 64; ++i)
        m[i] = SIG1(m[i-2]) + m[i-7] + SIG0(m[i-15]) + m[i-16];

    a = state[0]; b = state[1]; c = state[2]; d = state[3];
    e = state[4]; f = state[5]; g = state[6]; h = state[7];

    for (i = 0; i < 64; ++i) {
        t1 = h + EP1(e) + CH(e,f,g) + k[i] + m[i];
        t2 = EP0(a) + MAJ(a,b,c);
        h = g; g = f; f = e; e = d + t1;
        d = c; c = b; b = a; a = t1 + t2;
    }

    state[0] += a; state[1] += b; state[2] += c; state[3] += d;
    state[4] += e; state[5] += f; state[6] += g; state[7] += h;
}

void sha256_hash(const char *input, char output_hex[65]) {
    uint32_t state[8] = {
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    };
    uint64_t bitlen = 0;
    uint8_t data[64];
    size_t datalen = 0;
    size_t i;
    
    for (i = 0; input[i] != '\0'; ++i) {
        data[datalen] = input[i];
        datalen++;
        if (datalen == 64) {
            transform(state, data);
            bitlen += 512;
            datalen = 0;
        }
    }

    bitlen += datalen * 8;
    data[datalen] = 0x80;
    datalen++;

    if (datalen > 56) {
        while (datalen < 64) data[datalen++] = 0x00;
        transform(state, data);
        datalen = 0;
    }

    while (datalen < 56) data[datalen++] = 0x00;

    bitlen = ((bitlen << 32) & 0xFFFFFFFF00000000ULL) | ((bitlen >> 32) & 0x00000000FFFFFFFFULL);
    
    // Convert bitlen to big endian uint8 array properly
    for (i = 0; i < 8; ++i) {
        data[63 - i] = (bitlen >> (i * 8)) & 0xFF;
    }
    
    // Correction: the previous bitlen shift was flawed. We actually just need to put bitlen as 64-bit big endian.
    // Let's redo bitlen correctly.
    uint64_t real_bitlen = i * 8; // i is the string length from before
    for (i = 0; i < 8; ++i) {
        data[63 - i] = (real_bitlen >> (i * 8)) & 0xFF;
    }

    transform(state, data);

    for (i = 0; i < 4; ++i) {
        sprintf(output_hex + i*8, "%02x%02x%02x%02x",
            (state[i] >> 24) & 0xFF, (state[i] >> 16) & 0xFF,
            (state[i] >> 8) & 0xFF, state[i] & 0xFF);
        sprintf(output_hex + 32 + i*8, "%02x%02x%02x%02x",
            (state[i+4] >> 24) & 0xFF, (state[i+4] >> 16) & 0xFF,
            (state[i+4] >> 8) & 0xFF, state[i+4] & 0xFF);
    }
    output_hex[64] = '\0';
}
