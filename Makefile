.PHONY: install build lint fix test mutation check

node_modules/.install: package-lock.json
	npm ci
	@touch node_modules/.install

install: node_modules/.install

build: node_modules/.install
	npm run build

# The Publish (packaging) pass of the check reads dist/.
lint: build
	npm run lint

fix: node_modules/.install
	npx typescript fix

test: node_modules/.install
	npm test

mutation: build
	npx typescript mutation

check: lint test mutation
