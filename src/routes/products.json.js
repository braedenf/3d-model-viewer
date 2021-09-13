export async function get() {
	return {
		status: 200,
		body: {
			products: [
				{
					type: 'seat',
					name: 'Carousel',
					variants: ['HighBack', 'MedBack', 'LowBack'],
					materials: [
						'MaharamMeld-Gloss',
						'MaharamMeld-Crater',
						'MaharamMeld-Antler',
						'MaharamMeld-Bare',
						'MaharamMeld-Quill',
						'MaharamMeld-Panda',
						'MaharamMeld-Kiss',
						'MaharamMeld-SeaShell'
					]
				},
				{
					type: 'light',
					name: 'HexPendant',
					variants: ['500', '750', '1000'],
					materials: ['Aluminium', 'Black', 'Brass', 'White']
				}
			]
		}
	};
}
