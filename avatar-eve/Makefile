PORT    ?= 8765
DEPLOY  ?= $(HOME)/src/circularly/evetar

.PHONY: all build dev test clean deploy

all: build

vendor/dicebear.js: vendor-entry.mjs node_modules
	npm run build

build: vendor/dicebear.js

node_modules: package.json
	npm install
	@touch node_modules

dev: vendor/dicebear.js
	npm run dev -- $(PORT)

test: vendor/dicebear.js
	npm test

deploy: vendor/dicebear.js
	rsync -av --delete --exclude='node_modules' --exclude='package-lock.json' \
	  --exclude='test-results' --exclude='playwright-report' \
	  --exclude='tests' --exclude='playwright.config.js' \
	  --exclude='.gitignore' --exclude='scripts' \
	  --exclude='dev.sh' --exclude='livereload.js' \
	  --exclude='vendor-entry.mjs' --exclude='Makefile' \
	  --exclude='package.json' \
	  ./ $(DEPLOY)/
	sed -i '' '/<script src="livereload.js">/d' $(DEPLOY)/index.html

clean:
	rm -f vendor/dicebear.js
