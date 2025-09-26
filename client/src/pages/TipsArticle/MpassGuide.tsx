// src/pages/TipsArticle/MpassGuide.tsx
import mpass1 from '../../assets/tips/mpass/mpass1.png'
import mpass2 from '../../assets/tips/mpass/mpass2.png'

export default function MpassGuide() {
	const priceRows = [
		{ classification: '1 day pass', price: '15,000', discount: '12,000' },
		{ classification: '2 day pass', price: '25,000', discount: '20,000' },
		{ classification: '3 day pass', price: '35,000', discount: '27,500' },
		{ classification: '5 day pass', price: '45,000', discount: '40,000' },
	]

	const issuingRows = [
		{
			category: 'Downtown',
			region: 'Seoul Station',
			name: 'Tmoney Town',
			location: 'Seoul City Tower 1F (Seoul Station Exit No.10)',
			hour: '09:00–18:00 (weekdays)',
		},
	]

	return (
		<article className="w-full max-w-[520px]">
			{/* 배지 */}
			<div className="mb-5">
				<span className="inline-block rounded-full px-6 py-2 text-white bg-[#7C3AED] text-sm font-semibold shadow-sm">
					Mpass(Daily Pass)
				</span>
			</div>

			{/* 제목/부제 */}
			<h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
				How to use the Mpass card
			</h1>
			<div className="mt-6 text-center">
				<p className="font-semibold">Tmoney Only for Foreigners</p>
				<p className="mt-2 text-sm text-gray-600">
					We would like to introduce Tmoney for Foreign Tourists.
				</p>
			</div>

			{/* 히어로 이미지 */}
			<div className="mt-6 flex justify-center">
				<img
					src={mpass1}
					alt="Mpass card main"
					className="w-full max-w-[360px] h-auto object-contain block"
					loading="lazy"
				/>
			</div>

			{/* 개요 */}
			<section className="mt-8">
				<p className="text-sm text-gray-800">
					Transportation daily pass which enables the users to ride the public transportation such
					as Seoul metropolitan subway, Seoul bus, and Airport Railroad Express up to 20 times a
					day.
				</p>
			</section>

			{/* Price and Issuing Centers */}
			<section className="mt-10">
				<h2 className="text-base font-bold flex items-center gap-2">
					<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[11px]">
						●
					</span>
					Price and Issuing Centers
				</h2>

				<ul className="mt-3 space-y-2 text-sm text-gray-800 list-disc pl-5">
					<li>
						<b>Price :</b> <span className="underline">CASH ONLY</span> (Korean currency)
					</li>
				</ul>

				{/* 가격표 */}
				<div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
					<table className="w-full text-sm border-collapse">
						<thead className="bg-gray-50">
							<tr className="text-left">
								<th className="p-3 w-48 border-b border-r border-gray-200">Classification</th>
								<th className="p-3 w-32 border-b border-r border-gray-200">Price(KRW)</th>
								<th className="p-3 border-b border-gray-200">Discount price after DDP</th>
							</tr>
						</thead>
						<tbody>
							{priceRows.map((r) => (
								<tr key={r.classification} className="last:[&>td]:border-b-0">
									<td className="p-3 border-r border-b border-gray-200">{r.classification}</td>
									<td className="p-3 border-r border-b border-gray-200">{r.price}</td>
									<td className="p-3 border-b border-gray-200">{r.discount}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* 가격 노트 */}
				<p className="mt-2 text-[12px] leading-5 text-gray-600">
					※ Discount will be applied only to persons who hold the DDP.
					<br />
					※ Discount is applied at issuing centers when issuing the card. (If refunded, the service
					fee may be deducted.)
					<br />※ When refunding within the validity period, a certain fee may be deducted according
					to policies.
				</p>

				{/* 발급/반납 센터 */}
				<div className="mt-6 overflow-hidden rounded-lg border border-gray-200">
					<table className="w-full text-sm border-collapse">
						<thead className="bg-gray-50">
							<tr className="text-left">
								<th className="p-3 w-28 border-b border-r border-gray-200">Category</th>
								<th className="p-3 w-36 border-b border-r border-gray-200">Region</th>
								<th className="p-3 w-40 border-b border-r border-gray-200">Name</th>
								<th className="p-3 border-b border-r border-gray-200">Location</th>
								<th className="p-3 w-40 border-b border-gray-200">Operating Hour</th>
							</tr>
						</thead>
						<tbody>
							{issuingRows.map((r, i) => (
								<tr key={i}>
									<td className="p-3 border-r border-gray-200">{r.category}</td>
									<td className="p-3 border-r border-gray-200">{r.region}</td>
									<td className="p-3 border-r border-gray-200">{r.name}</td>
									<td className="p-3 border-r border-gray-200">{r.location}</td>
									<td className="p-3 whitespace-pre-line">{r.hour}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* Mpass Guide */}
			<section className="mt-10">
				<h2 className="text-lg font-semibold">Mpass Guide</h2>
				<ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-800">
					<li>
						If you are a tourist who uses public transportation frequently, save transportation fare
						with Mpass that enables you to ride up to 20 times a day.
					</li>
					<li>
						<b>Devices Available with Mpass</b> : Seoul metropolitan subway, Seoul buses
						(town/rapid/late-night), Airport Railroad Express (AREX).
					</li>
					<li>If your itinerary requires fewer rides, you may use the regular Tmoney card.</li>
				</ul>
			</section>

			{/* Notice */}
			<section className="mt-8">
				<h2 className="text-lg font-semibold">Notice</h2>
				<ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-800">
					<li>One day is calculated from the initial tag until midnight on the same day.</li>
					<li>
						If Mpass is 2 to 7 days, it is possible to use only in consecutive days. It is not
						possible to extend or change it during its use.
					</li>
					<li>
						If you do not use Mpass within 30 days from the issuance, it will not be possible to use
						it due to the expiration.
					</li>
				</ul>
			</section>

			{/* Foreigner-exclusive Tmoney cards */}
			<section className="mt-8">
				<h2 className="text-lg font-semibold">Foreigner-exclusive Tmoney cards</h2>
				<p className="mt-2 text-sm text-gray-800">
					Mpass card that offers daily-pass public transportation up to 20 times a day for a maximum
					of 7 days. Card types include 1-day pass through 7-day pass; the validity is counted by
					calendar day. For details (refund/fee/usage conditions), please refer to the official
					leaflet or ask at the service counter.
				</p>
			</section>

			{/* 하단 이미지 */}
			<div className="mt-10 flex justify-center">
				<img
					src={mpass2}
					alt="Mpass cards"
					className="w-full max-w-[420px] h-auto object-contain block"
					loading="lazy"
				/>
			</div>

			<div className="mb-16" />
		</article>
	)
}
