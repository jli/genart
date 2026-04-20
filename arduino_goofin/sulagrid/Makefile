FQBN = adafruit:samd:adafruit_trinket_m0
SKETCH = sulagrid
PORT ?= $(shell arduino-cli board list | grep $(FQBN) | awk '{print $$1}')
BAUD ?= 115200

compile:
	arduino-cli compile --fqbn $(FQBN) .

upload:
	arduino-cli upload -p $(PORT) --fqbn $(FQBN) .

all: compile upload

monitor:
	arduino-cli monitor -p $(PORT) --config baudrate=$(BAUD)

watch:
	watchexec -e ino --stop-timeout 0 -- sh -c 'make compile && make upload && sleep 2 && make monitor'

.PHONY: compile upload all monitor watch
