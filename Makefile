.PHONY: start build clean

APP ?= disputes-frontend
start:
	pnpm --filter @polkadot/$(APP) dev

build:
	pnpm turbo build --filter=@polkadot/$(APP)

clean:
	pnpm turbo clean
