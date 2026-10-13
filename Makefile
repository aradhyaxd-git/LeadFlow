.PHONY: setup dev-api dev-web seed test lint

PYTHON ?= python3

setup:
	$(PYTHON) -m venv backend/.venv
	backend/.venv/bin/pip install --upgrade pip
	backend/.venv/bin/pip install -r backend/requirements-dev.txt
	test -f backend/.env || cp backend/.env.example backend/.env
	cd frontend && npm install
	test -f frontend/.env.local || cp frontend/.env.example frontend/.env.local
	test -f .env || cp .env.example .env

dev-api:
	cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-web:
	cd frontend && npm run dev

seed:
	cd backend && .venv/bin/python -m app.seed

test:
	cd backend && .venv/bin/pytest
	cd frontend && npm run test -- --run

lint:
	cd backend && .venv/bin/ruff check .
	cd frontend && npm run lint && npx tsc --noEmit
