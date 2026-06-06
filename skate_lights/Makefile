# skate_lights build tooling
#
# PlatformIO is installed into a uv-managed venv so the toolchain is pinned and
# reproducible on a fresh machine. All targets shell out through `uv run`, which
# resolves/creates the venv from pyproject.toml + uv.lock on first use.
#
# Quick start on a new machine:
#   make setup     # create .venv with pinned PlatformIO
#   make build     # compile firmware
#   make upload    # flash a connected XIAO ESP32-S3
#   make monitor   # open serial monitor at 115200
#   make flash     # upload then monitor

ENV := seeed_xiao_esp32s3
PIO := uv run pio

.DEFAULT_GOAL := help

.PHONY: setup build upload monitor flash clean distclean fmt fmt-check help

setup: ## Create/sync the uv venv with pinned PlatformIO
	uv sync

build: ## Compile firmware for the XIAO ESP32-S3
	$(PIO) run -e $(ENV)

upload: ## Build and flash a connected board
	$(PIO) run -e $(ENV) -t upload

monitor: ## Open the serial monitor (115200 baud, Ctrl-C to exit)
	$(PIO) device monitor -b 115200

flash: upload monitor ## Upload then immediately open the serial monitor

clean: ## Remove PlatformIO build artifacts
	$(PIO) run -e $(ENV) -t clean

distclean: clean ## Also remove the .pio cache and the uv venv
	rm -rf .pio .venv

fmt: ## Format C/C++ sources in place (clang-format)
	clang-format -i src/*.cpp src/*.h

fmt-check: ## Verify sources are formatted (CI-friendly, non-mutating)
	clang-format --dry-run --Werror src/*.cpp src/*.h

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
