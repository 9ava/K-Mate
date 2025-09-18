import { useAuth } from '../../features/auth/useAuth'

export default function GoogleLoginButton() {
	const { loginWithGoogle } = useAuth()
	return (
		<button
			onClick={loginWithGoogle}
			className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-full shadow hover:bg-gray-50"
		>
			<img
				src="https://developers.google.com/identity/images/g-logo.png"
				alt="Google"
				className="w-5 h-5"
			/>
			Continue with Google
		</button>
	)
}
