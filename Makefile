test:
	@./node_modules/mocha/bin/mocha --colors -t 10000 --reporter dot test/*.test.js

.PHONY: test
