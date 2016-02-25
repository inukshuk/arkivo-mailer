BIN = ./node_modules/.bin

SRC = lib/*.js
TEST = test/*.js

lint:
	@${BIN}/eslint ${SRC} ${TEST}

test: lint
	@${BIN}/mocha ${TEST}

debug:
	@${BIN}/mocha debug ${TEST}

test-travis:
	@node ${BIN}/istanbul cover ${BIN}/_mocha --report-lcovonly -- ${TEST}

spec:
	@${BIN}/mocha --reporter spec ${TEST}

coverage: clean
	@node ${BIN}/istanbul cover ${BIN}/_mocha -- ${TEST}

clean:
	@rm -rf ./coverage

.PHONY: lint clean test debug test-travis spec coverage
