import { useState } from 'react'
import ErrorDisplay from '../components/common/ErrorDisplay'

export default function ErrorDisplayDemoPage() {
	const [showDemo, setShowDemo] = useState<string | null>(null)

	const demoItems = [
		{
			id: 'network',
			title: '네트워크 에러',
			type: 'network' as const
		},
		{
			id: 'notFound',
			title: '데이터 없음',
			type: 'notFound' as const
		},
		{
			id: 'unauthorized',
			title: '권한 없음',
			type: 'unauthorized' as const
		},
		{
			id: 'server',
			title: '서버 에러',
			type: 'server' as const
		},
		{
			id: 'validation',
			title: '입력 에러',
			type: 'validation' as const
		},
		{
			id: 'custom',
			title: '커스텀 에러',
			type: 'default' as const
		}
	]

	const handleRetry = () => {
		alert('재시도 버튼 클릭!')
	}

	const handleLogin = () => {
		alert('로그인 버튼 클릭!')
	}

	const handleGoBack = () => {
		alert('뒤로가기 버튼 클릭!')
	}

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">ErrorDisplay 컴포넌트 데모</h1>
			
			{/* 데모 버튼들 */}
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
				{demoItems.map((item) => (
					<button
						key={item.id}
						onClick={() => setShowDemo(item.id)}
						className="p-3 bg-blue-100 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors"
					>
						{item.title}
					</button>
				))}
				<button
					onClick={() => setShowDemo(null)}
					className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
				>
					데모 숨기기
				</button>
			</div>

			{/* 에러 디스플레이 데모들 */}
			{showDemo && (
				<div className="space-y-6">
					<h2 className="text-lg font-semibold">
						{demoItems.find(item => item.id === showDemo)?.title} 예시
					</h2>
					
					{/* Small 크기 */}
					<div>
						<h3 className="text-md font-medium mb-2">Small 크기</h3>
						{showDemo === 'network' && (
							<ErrorDisplay type="network" size="small" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'notFound' && (
							<ErrorDisplay type="notFound" size="small" />
						)}
						{showDemo === 'unauthorized' && (
							<ErrorDisplay 
								type="unauthorized" 
								size="small" 
								actions={[
									{ label: '로그인', onClick: handleLogin, variant: 'primary' },
									{ label: '뒤로가기', onClick: handleGoBack, variant: 'secondary' }
								]}
							/>
						)}
						{showDemo === 'server' && (
							<ErrorDisplay type="server" size="small" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'validation' && (
							<ErrorDisplay type="validation" size="small" />
						)}
						{showDemo === 'custom' && (
							<ErrorDisplay 
								type="default" 
								size="small"
								title="커스텀 에러 제목"
								message="이것은 커스텀 에러 메시지입니다."
								showRetry
								onRetry={handleRetry}
							/>
						)}
					</div>

					{/* Medium 크기 */}
					<div>
						<h3 className="text-md font-medium mb-2">Medium 크기 (기본)</h3>
						{showDemo === 'network' && (
							<ErrorDisplay type="network" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'notFound' && (
							<ErrorDisplay type="notFound" />
						)}
						{showDemo === 'unauthorized' && (
							<ErrorDisplay 
								type="unauthorized" 
								actions={[
									{ label: '로그인', onClick: handleLogin, variant: 'primary' },
									{ label: '뒤로가기', onClick: handleGoBack, variant: 'secondary' }
								]}
							/>
						)}
						{showDemo === 'server' && (
							<ErrorDisplay type="server" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'validation' && (
							<ErrorDisplay type="validation" />
						)}
						{showDemo === 'custom' && (
							<ErrorDisplay 
								type="default"
								title="커스텀 에러 제목"
								message="이것은 커스텀 에러 메시지입니다. 좀 더 긴 설명을 넣을 수도 있습니다."
								showRetry
								onRetry={handleRetry}
								actions={[
									{ label: '고객센터', onClick: () => alert('고객센터 연결!'), variant: 'secondary' }
								]}
							/>
						)}
					</div>

					{/* Large 크기 */}
					<div>
						<h3 className="text-md font-medium mb-2">Large 크기</h3>
						{showDemo === 'network' && (
							<ErrorDisplay type="network" size="large" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'notFound' && (
							<ErrorDisplay type="notFound" size="large" />
						)}
						{showDemo === 'unauthorized' && (
							<ErrorDisplay 
								type="unauthorized" 
								size="large"
								actions={[
									{ label: '로그인', onClick: handleLogin, variant: 'primary' },
									{ label: '뒤로가기', onClick: handleGoBack, variant: 'secondary' }
								]}
							/>
						)}
						{showDemo === 'server' && (
							<ErrorDisplay type="server" size="large" showRetry onRetry={handleRetry} />
						)}
						{showDemo === 'validation' && (
							<ErrorDisplay type="validation" size="large" />
						)}
						{showDemo === 'custom' && (
							<ErrorDisplay 
								type="default" 
								size="large"
								title="대형 커스텀 에러"
								message="이것은 큰 크기의 커스텀 에러 메시지입니다. 중요한 에러나 전체 페이지 에러에 사용할 수 있습니다."
								hideIcon
								actions={[
									{ label: '다시 시도', onClick: handleRetry, variant: 'primary' },
									{ label: '홈으로', onClick: () => alert('홈으로!'), variant: 'secondary' },
									{ label: '신고하기', onClick: () => alert('신고!'), variant: 'danger' }
								]}
							/>
						)}
					</div>
				</div>
			)}

			{/* 사용법 안내 */}
			{!showDemo && (
				<div className="bg-gray-50 rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-3">사용법</h2>
					<div className="space-y-2 text-sm text-gray-700">
						<p><strong>기본 사용:</strong> <code>&lt;ErrorDisplay type="network" /&gt;</code></p>
						<p><strong>재시도 버튼:</strong> <code>&lt;ErrorDisplay type="server" showRetry onRetry=&#123;handleRetry&#125; /&gt;</code></p>
						<p><strong>커스텀 액션:</strong> <code>actions</code> prop으로 추가 버튼들 설정</p>
						<p><strong>크기 조절:</strong> <code>size="small|medium|large"</code></p>
						<p><strong>커스텀 메시지:</strong> <code>title</code>, <code>message</code> prop 사용</p>
					</div>
				</div>
			)}
		</div>
	)
}