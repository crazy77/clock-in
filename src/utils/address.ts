export const getAddress = async (lat: number, lng: number) => {
	const clientId = "rroxtj31za";
	const clientSecret = "YHCb5gmmOY3B5PaY3c5sKVK6twBlKT5t42qaUfni";
	const response = await fetch(
		`https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&orders=roadaddr&output=json`,
		{
			headers: {
				"X-NCP-APIGW-API-KEY-ID": clientId,
				"X-NCP-APIGW-API-KEY": clientSecret,
			},
		},
	);
	const address = await response.json();
	const region = address?.results?.[0]?.region;
	const land = address?.results?.[0]?.land;
	const result = `${region?.area2?.name} ${region?.area3?.name} ${region?.area4?.name ? `${region?.area4?.name} ` : ""}${land?.name ?? ""} ${land?.number1}${land?.number2 ? `-${land?.number2}` : ""}`;
	return result;
};
