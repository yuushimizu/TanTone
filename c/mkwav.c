#include <stdio.h>
#include <math.h>

void write_int(int value, int bytes, FILE *fp) {
  int i;
  for (i = 0; i < bytes; ++i) {
    int byte = (value & (0xFF << (i * 8))) >> (i * 8);
    fwrite(&byte, 1, 1, fp);
  }
}

struct wav_info {
  int samples_per_second;
  int channels;
  int bytes_per_channel_sample;
};

int wav_info_format_length(struct wav_info *wav_info) {
  return 16;
}

int wav_info_data_length(struct wav_info *wav_info, int sample_count) {
  return sample_count * wav_info->bytes_per_channel_sample * wav_info->channels;
}

int wav_info_max_volume(struct wav_info *wav_info) {
  return pow(255, wav_info->bytes_per_channel_sample) / 2;
}

void write_format_part(struct wav_info *wav_info, int sample_count, FILE *fp) {
  fwrite("fmt ", 4, 1, fp);
  write_int(wav_info_format_length(wav_info), 4, fp);
  write_int(1, 2, fp); // format id = Linear PCM
  write_int(wav_info->channels, 2, fp);
  write_int(wav_info->samples_per_second, 4, fp);
  write_int(wav_info->samples_per_second * wav_info->bytes_per_channel_sample * 8 * wav_info->channels, 4, fp); // speed
  write_int(wav_info->bytes_per_channel_sample * 8 * wav_info->channels, 2, fp); // block size
  write_int(wav_info->bytes_per_channel_sample * 8, 2, fp);
}

/*void write_saw_wave(struct wav_info *wav_info, int sample_count, FILE *fp) {
  double wave_rate = 440;
  double increase = wave_rate / wav_info->sample_per_second;
  double max_volume = wav_info_max_volume(wav_info);
  double volume = max_volume * 0.5;
  double current = 0;
  int i;
  for (i = 0; i < sample_count; ++i) {
    int channel;
    for (channel = 0; channel < wav_info->channels; ++channel) {
    }
    current += increase;
    if (current > wave_rate)
  }
  }*/

void write_sin_wave(struct wav_info *wav_info, int sample_count, FILE *fp) {
  double wave_rate = 440;
  double interval = (wave_rate * M_PI * 2) / wav_info->samples_per_second;
  double max_volume = wav_info_max_volume(wav_info);
  double volume = max_volume * 0.5;
  double current = 0;
  int i;
  for (i = 0; i < sample_count; ++i) {
    double value = sin(current) * volume;
    int channel;
    for (channel = 0; channel < wav_info->channels; ++channel) {
      write_int(value, wav_info->bytes_per_channel_sample, fp);
    }
    current += interval;
  }
}

int main(int argc, char **argv) {
  struct wav_info wav_info;
  wav_info.samples_per_second = 44100;
  wav_info.channels = 2;
  wav_info.bytes_per_channel_sample = 2;
  int sample_count = wav_info.samples_per_second;
  int format_length = wav_info_format_length(&wav_info);
  int data_length = wav_info_data_length(&wav_info, sample_count);
  FILE *fp = fopen("sample.wav", "w");
  fwrite("RIFF", 4, 1, fp);
  write_int(8 + format_length + 8 + data_length, 4, fp); // bytes in file - 8
  fwrite("WAVE", 4, 1, fp);
  write_format_part(&wav_info, sample_count, fp);
  fwrite("data", 4, 1, fp);
  write_int(data_length, 4, fp); // bytes in data
  write_sin_wave(&wav_info, sample_count, fp);
  fclose(fp);
  return 0;
}
