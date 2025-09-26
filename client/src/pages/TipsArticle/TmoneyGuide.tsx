// src/pages/TipsArticle/TmoneyTextGuide.tsx

// (선택) 카드 사진/로고를 쓰고 싶으면 아래처럼 import 해서 cards / merchants 의 logo에 경로를 넣어주세요.
// import card1 from '@/assets/tips/tmoney/cards/card-01.png'
// import whaleLogo from '@/assets/tips/tmoney/merchants/whale.png'

import tmoneyCards from '../../assets/tips/tmoney/tmoney-cards.png'

export default function TmoneyTextGuide() {
	// 카드 갤러리 (선택)
	const cards: { src?: string; alt: string }[] = [
		// { src: card1, alt: 'Tmoney Travel Card 1' },
	]

	// 제휴처 데이터
	const merchants: { name: string; benefit: string[]; logo?: string; footnote?: string }[] = [
		{
			name: 'Whale Telecoms',
			benefit: [
				'10% discount on data-only plans, voice + text + data plans or Wi-Fi set (router + charger + power bank + case)',
			],
			// logo: whaleLogo,
		},
		{
			name: 'Nanta Hotel & Show',
			benefit: [
				'20% discount for online reservations via official website',
				'10% discount and a free NANTA gift for on-site purchases',
			],
		},
		{
			name: 'Arario Museum in Space',
			benefit: ['30% discount on admission fee'],
		},
		{
			name: 'Paradise Casino Walkerhill',
			benefit: [
				'KRW 80,000 betting coupon, free meal and souvenir provided',
				'Up to 10,000 points taxi fare reimbursement',
			],
			footnote: '*New customers with play record only (passport & taxi receipt required)',
		},
		{
			name: 'K-Pop Central',
			benefit: ['20% discount on K-pop dance activity experiences, K-pop tour'],
		},
		{
			name: 'Real Escape Challenge',
			benefit: ['10% discount on escape room game experience fee'],
		},
		{
			name: 'Real K-pop Dance',
			benefit: ['10% discount on hallyu experience program'],
		},
	]

	return (
		<article className="w-full max-w-[520px]">
			{/* 상단 배지 */}
			<div className="mb-5">
				<span className="inline-block rounded-full px-6 py-2 text-white bg-[#7C3AED] text-sm font-semibold shadow-sm">
					Tmoney
				</span>
			</div>

			{/* 제목/서브텍스트 */}
			<h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
				How to use the Tmoney card
			</h1>

			<div className="mt-6 text-center">
				<p className="font-semibold">Tmoney Only for Foreigners</p>
				<p className="mt-2 text-sm text-gray-600">
					We would like to introduce Tmoney for Foreign Tourists.
				</p>

				<p className="mt-6 font-semibold">
					You can use TMONEY TRAVEL CARD for public
					<br />
					transportation anywhere in the country.
				</p>
			</div>

			<div className="mt-6 flex justify-center">
				<img
					src={tmoneyCards}
					alt="Tmoney travel cards"
					className="w-full max-w-[360px] h-auto  object-contain block"
					loading="lazy"
				/>
			</div>

			{/* (선택) 카드 이미지 갤러리 */}
			{cards.length > 0 && (
				<div className="mt-6 grid grid-cols-3 gap-3 justify-items-center">
					{cards.map((c, i) => (
						<div key={i} className="w-28 h-36 rounded-md overflow-hidden border bg-gray-50">
							{c.src ? (
								<img
									src={c.src}
									alt={c.alt}
									className="w-full h-full object-cover"
									loading="lazy"
								/>
							) : (
								<div className="w-full h-full grid place-items-center text-xs text-gray-400">
									(card)
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Price and Stores */}
			<section className="mt-10">
				<h2 className="text-base font-bold flex items-center gap-2">
					<span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[11px]">
						●
					</span>
					Price and Stores
				</h2>
				<ul className="mt-3 space-y-2 text-sm text-gray-800 list-disc pl-5">
					<li>
						<b>Price :</b> 4,000 KRW (Korean currency)
					</li>
					<li>
						<b>Stores :</b> Convenient stores &amp; bus ticket office in Incheon airport
					</li>
				</ul>
			</section>

			{/* Affiliated merchants 버튼 */}
			<div className="mt-8 flex justify-center">
				<div className="inline-flex items-center rounded-lg bg-black text-white px-6 py-3 text-sm font-semibold shadow-sm">
					Affiliated merchants
				</div>
			</div>

			{/* 제휴처 표 */}
			<section className="mt-6">
				<table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
					<tbody className="divide-y divide-gray-200">
						{merchants.map((m) => (
							<tr key={m.name}>
								<td className="p-3 align-top">
									<div className="flex items-center gap-3">
										{m.logo ? (
											<img
												src={m.logo}
												alt={`${m.name} logo`}
												className="w-7 h-7 rounded-sm object-cover"
												loading="lazy"
											/>
										) : (
											<div className="w-7 h-7 rounded-sm bg-gray-200 grid place-items-center text-[10px] text-gray-500">
												logo
											</div>
										)}
										<span className="font-medium">{m.name}</span>
									</div>
								</td>
								<td className="p-3 align-top">
									{m.benefit.map((line, i) => (
										<div key={i}>{line}</div>
									))}
									{m.footnote && <div className="text-[12px] text-gray-500 mt-1">{m.footnote}</div>}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			{/* Transfer Discount */}
			<section className="mt-10">
				<h2 className="text-lg font-semibold">Transfer Discount</h2>
				<p className="mt-2 text-sm text-gray-800">
					If you use public transportation (i.e. subway, bus) with your Tmoney card, you can get a
					₩100-plus discount for every ride.
					<br />
					Tmoney card holders can enjoy up to four discounts a day, if they transfer within a
					transfer time limit of 30 minutes (up to 1 hour from 9pm to 7am next day).
					<br />
					The discount is applicable to transfers from subway to bus &amp; vice versa, and between
					one bus to another (excluding buses running along the same route).
				</p>
			</section>

			{/* Base Fare Discount */}
			<section className="mt-8">
				<h2 className="text-lg font-semibold">Base Fare Discount (only for youth/children)</h2>
				<p className="mt-2 text-sm text-gray-800">
					Children or youth users can enjoy the discounted fare if they register their card with
					their date of birth in convenience stores or information center in subway station, by
					presenting Tmoney card and ID card.
				</p>
				<ul className="mt-3 text-sm text-gray-800">
					<li>
						<b>Children :</b> Age 6 to 12
					</li>
					<li>
						<b>Youth :</b> Age 13 to 18
					</li>
				</ul>
				<p className="mt-2 text-xs text-red-600">
					* Caution : Adults using children or youth cards will be subject to a fine worth 30 times
					that of the base fare.
				</p>
			</section>

			{/* Top-up */}
			<section className="mt-8">
				<h2 className="text-lg font-semibold">Top-up</h2>
				<p className="mt-2 text-sm text-gray-800">
					Present your Tmoney card and cash (in Korean won) for top-up in Tmoney sales locations.
					You can top-up the card in the unit of ₩1,000, in the range of ₩1,000 to ₩90,000. The
					amount of money deposited in Tmoney card may not exceed ₩500,000.
				</p>

				<table className="mt-3 w-full border border-gray-200 rounded-lg overflow-hidden text-sm">
					<tbody className="divide-y divide-gray-200">
						<tr>
							<th className="bg-gray-50 text-left w-40 p-3 font-semibold">Convenience Store</th>
							<td className="p-3">GS25, CU, 7-Eleven, MINISTOP, Story Way, Emart24, 365PLUS</td>
						</tr>
						<tr>
							<th className="bg-gray-50 text-left w-40 p-3 font-semibold">
								Subway Stations (Top-up Only)
							</th>
							<td className="p-3">
								- Top-up machine including One-time ticket issuer, Tmoney vending machine, portable
								reload machine
								<br />- Information Center
							</td>
						</tr>
						<tr>
							<th className="bg-gray-50 text-left w-40 p-3 font-semibold">Others</th>
							<td className="p-3">Tmoney Town (Seoul Stn Exit#10, Seoul City Tower 1F)</td>
						</tr>
					</tbody>
				</table>
			</section>

			{/* Refund */}
			<section className="mt-8 mb-16">
				<h2 className="text-lg font-semibold">Refund</h2>
				<p className="mt-2 text-sm text-gray-800">
					Present your Tmoney card and inform the staff how much you want to refund in Tmoney card
					sales/Top-up locations. The refund will be given to you in cash in Korean won along with
					card.
				</p>
				<ul className="mt-2 text-sm text-gray-800 list-disc pl-5">
					<li>Refund does not include the cost of card.</li>
					<li>The service fee of ₩500 will be charged.</li>
				</ul>
				<p className="mt-2 text-xs text-red-600">
					* Caution : Partial refunds are only available at Tmoney Town and Tmoney service center in
					subway station. Partial refunds are available only for amounts between 10,000 and 50,000
					KRW, and will be refunded in units of 10,000 KRW. (Plate tmoney cards only)
				</p>
			</section>
		</article>
	)
}
