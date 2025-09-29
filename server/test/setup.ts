// test/setup.ts
// Jest E2E 테스트 설정 파일

// Jest 글로벌 타입 정의
import '@types/jest'

// Jest 글로벌 함수들을 명시적으로 선언
declare global {
	const describe: jest.Describe
	const it: jest.It
	const test: jest.It
	const expect: jest.Expect
	const beforeAll: jest.Lifecycle
	const beforeEach: jest.Lifecycle
	const afterAll: jest.Lifecycle
	const afterEach: jest.Lifecycle
}

// 테스트 환경 설정
beforeAll(async () => {
	// E2E 테스트 전 공통 설정
})

afterAll(async () => {
	// E2E 테스트 후 정리 작업
})
