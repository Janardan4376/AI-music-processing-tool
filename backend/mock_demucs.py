import time
import sys

print("Mock Demucs Started")
for i in range(0, 101, 10):
    print(f" {i}%|██████    | 12.6M/80.2M [00:00<00:02, 25.2MB/s]")
    sys.stdout.flush()
    time.sleep(0.5)

print("Mock Demucs Finished")
