import { Handler } from '@netlify/functions';

const handler: Handler = async (event, _) => {
	const ip = event.headers['x-forwarded-for'];
	const client = ip.split(',')[0];

	return {
		statusCode: 200,
		body: client
	};
};

export { handler };
