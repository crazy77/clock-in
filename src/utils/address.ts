export const getAddress = async (lat: number, lng: number) => {
	const clientId = "rroxtj31za";
	const clientSecret = "YHCb5gmmOY3B5PaY3c5sKVK6twBlKT5t42qaUfni";
	const response = await fetch(
		`https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc?coords=${lng},${lat}&orders=addr,roadaddr&output=json`,
		{
			headers: {
				"X-NCP-APIGW-API-KEY-ID": clientId,
				"X-NCP-APIGW-API-KEY": clientSecret,
			},
		},
	);
	const data = await response.json();
	return data;
};
