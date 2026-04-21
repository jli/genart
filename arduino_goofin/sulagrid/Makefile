FQBN        = adafruit:samd:adafruit_trinket_m0
SKETCH      = sulagrid
PORT       ?= $(shell arduino-cli board list | grep $(FQBN) | awk '{print $$1}')
BAUD       ?= 115200
BUILD_PATH = /tmp/arduino-build-$(SKETCH)

# arduino-cli reuses compiled .o files in BUILD_PATH and skips unchanged
# translation units on subsequent runs — similar to make's timestamp check.
compile:
	arduino-cli compile --fqbn $(FQBN) --build-path $(BUILD_PATH) .

upload:
	arduino-cli upload -p $(PORT) --fqbn $(FQBN) --build-path $(BUILD_PATH) .

all: compile upload

monitor:
	arduino-cli monitor -p $(PORT) --config baudrate=$(BAUD) --timestamp

watch:
	watchexec -e ino --on-busy-update restart --stop-timeout 0 -- \
		sh -c 'make compile && make upload && make monitor'

.PHONY: compile upload all monitor watch
