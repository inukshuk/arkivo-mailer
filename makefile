BIN = ./node_modules/.bin

SRC = lib/*.js
TEST = test/*.js

lint:
	@${BIN}/eslint ${SRC} ${TEST}

test: lint
	@${BIN}/mocha --harmony-generators ${TEST}

debug:
	@${BIN}/mocha --harmony-generators debug ${TEST}

test-travis:
	@node --harmony-generators \
		${BIN}/istanbul cover ${BIN}/_mocha --report-lcovonly -- ${TEST}

spec:
	@${BIN}/mocha --harmony-generators --reporter spec ${TEST}

coverage: clean
	@node --harmony-generators \
		${BIN}/istanbul cover ${BIN}/_mocha -- ${TEST}

clean:
	@rm -rf ./coverage

.PHONY: lint clean test debug test-travis spec coverage
