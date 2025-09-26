import ctApp from '../../assets/tips/catchtable/ct_app.png'
import ctWaitlist from '../../assets/tips/catchtable/ct_waitlist_guide.png'
import ctDownload from '../../assets/tips/catchtable/ct_download.png'

export default function CatchTableGuide() {
	return (
		<article className="w-full max-w-[520px]">
			{/* 배지 */}
			<div className="mb-5">
				<span className="inline-block rounded-full px-6 py-2 text-white bg-[#7C3AED] text-sm font-semibold shadow-sm">
					catchTABLE
				</span>
			</div>

			{/* 제목 */}
			<h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
				How to use the CatchTable
			</h1>

			{/* What is… */}
			<section className="mt-6">
				<h2 className="text-lg font-semibold underline underline-offset-4">
					What is Catchtable Global?
				</h2>
				<p className="mt-3 text-sm leading-relaxed text-gray-800">
					Catchtable Global lets you quickly create an account with Google or Apple and pay with
					non-Korean credit cards. The service supports multiple languages
					(English/Japanese/Simplified &amp; Traditional Chinese) so visitors can use it easily. Its
					two main features are <b>restaurant reservations</b> and <b>waiting</b>. The waiting
					feature supports both on-site and remote waitlist options.
				</p>
			</section>

			{/* 앱 화면 스샷 */}
			<div className="mt-6 flex justify-center">
				<img
					src={ctApp}
					alt="CatchTable app screenshots"
					className="w-full max-w-[420px] h-auto object-contain block"
					loading="lazy"
				/>
			</div>

			{/* Waitlist 설명 */}
			<section className="mt-8">
				<p className="text-sm text-gray-800">
					Simply write your wait number on the waiting pad of the popular restaurant you want to go
					to, and you’ll be able to check the real-time wait status through the CatchTable app!
					Conveniently wait for your favorite restaurants so you won’t forget once they’re ready.
				</p>
			</section>

			{/* 웨이팅 가이드 카드 */}
			<div className="mt-6 flex justify-center">
				<img
					src={ctWaitlist}
					alt="CatchTable waitlist guide"
					className="w-full max-w-[480px] h-auto object-contain block"
					loading="lazy"
				/>
			</div>

			{/* 다운로드 영역 */}
			<section className="mt-10">
				<h3 className="text-base font-semibold">Download the CATCHTABLE App</h3>
				<p className="mt-2 text-sm text-gray-700">
					Get the app and manage reservations or your waitlist in real time.
				</p>
				<div className="mt-5 flex justify-center">
					<img
						src={ctDownload}
						alt="Download CatchTable app"
						className="w-full max-w-[380px] h-auto object-contain block"
						loading="lazy"
					/>
				</div>
			</section>
		</article>
	)
}
