import { getDefaultStore } from "jotai";
import { useAtomValue } from "jotai";
import { languageAtom } from "~/stores/language";

const translations = {
	ko: {
		// 공통
		appName: "출퇴근 관리",
		login: "로그인",
		logout: "로그아웃",
		loading: "로딩 중...",
		error: "오류가 발생했습니다",
		success: "성공",
		cancel: "취소",
		confirm: "확인",
		save: "저장",
		edit: "수정",
		delete: "삭제",
		close: "닫기",

		// 인증
		signInWithKakao: "카카오로 로그인",
		welcome: "환영합니다",

		// 홈 화면
		home: "홈",
		currentTime: "현재 시간",
		currentLocation: "현재 위치",
		clockIn: "출근",
		clockOut: "퇴근",
		todayRecord: "오늘 출퇴근 기록",
		noRecordToday: "오늘 출퇴근 기록이 없습니다",
		clockInTime: "출근 시간",
		clockOutTime: "퇴근 시간",
		workingHours: "근무 시간",

		// 출퇴근 기록
		attendanceRecords: "출퇴근 기록",
		attendanceRecordsDescription: "개인 출퇴근 기록을 확인할 수 있습니다",
		date: "날짜",
		status: "상태",
		normal: "정상",
		late: "지각",
		earlyLeave: "조퇴",
		absent: "결근",
		noRecords: "출퇴근 기록이 없습니다",
		loadMore: "더 보기",

		// 관리자
		admin: "관리자",
		adminPanel: "관리자 패널",
		adminPanelDescription: "전체 직원의 출퇴근 상황을 관리합니다",
		workplaceSettings: "출퇴근 장소 설정",
		defaultTimes: "기본 출퇴근 시간",
		userSettings: "회원별 설정",
		todayStatus: "오늘 출퇴근 상황",
		monthlyRecords: "이번 달 출퇴근 기록",
		filterLateEarly: "지각/조퇴 필터",
		showAll: "전체 보기",
		totalEmployees: "전체 직원",
		clockedIn: "출근 완료",
		clockedOut: "퇴근 완료",
		noRecordsToday: "오늘 출퇴근 기록이 없습니다",
		noMonthlyRecords: "월별 기록이 없습니다",
		export: "내보내기",
		addWorkplace: "장소 추가",
		editWorkplace: "장소 수정",
		workplaceName: "장소명",
		latitude: "위도",
		longitude: "경도",
		radius: "반경",
		noWorkplaces: "등록된 장소가 없습니다",
		confirmDelete: "정말 삭제하시겠습니까?",
		add: "추가",
		noUserSettings: "사용자 설정이 없습니다",
		userSettingsGuide: "관리자에서 사용자를 추가하거나, 사용자가 최초 로그인 시 자동으로 생성됩니다.",
		defaultClockIn: "기본 출근시간",
		defaultClockOut: "기본 퇴근시간",

		// 시간 설정 페이지
		timeSettings: "출퇴근 시간 설정",
		timeSettingsDescription:
			"기본 출퇴근 시간과 개별 사용자별 시간을 설정할 수 있습니다",
		individualTimes: "개별 시간 설정",
		individualTimesDescription:
			"각 사용자별로 개별적인 출퇴근 시간을 설정합니다",
		defaultTimesDescription:
			"모든 사용자에게 적용할 기본 출퇴근 시간을 설정합니다",
		applyToAllUsers: "모든 사용자에게 적용",
		defaultTimesUpdated: "기본 시간이 업데이트되었습니다",
		userTimeUpdated: "사용자 시간이 업데이트되었습니다",

		// 공휴일 관리
		holidayManagement: "공휴일 관리",
		holidays: "공휴일",
		addHoliday: "공휴일 추가",
		editHoliday: "공휴일 수정",
		holidayName: "공휴일명",
		holidayType: "공휴일 유형",
		weeklyHoliday: "주간 공휴일",
		specificDateHoliday: "특정 날짜 공휴일",
		weeklyDay: "요일",
		specificDate: "특정 날짜",
		description: "설명",
		noHolidays: "등록된 공휴일이 없습니다",
		sunday: "일요일",
		monday: "월요일",
		tuesday: "화요일",
		wednesday: "수요일",
		thursday: "목요일",
		friday: "금요일",
		saturday: "토요일",

		// 공휴일 관리 추가 번역
		holidayManagementComingSoon: "공휴일 관리 기능이 곧 추가됩니다",
		selectHolidayType: "공휴일 유형 선택",
		selectDayOfWeek: "요일 선택",
		enterSpecificDate: "특정 날짜 입력",
		enterDescription: "설명 입력 (선택사항)",

		// 설정
		settings: "설정",
		theme: "테마",
		language: "언어",
		light: "라이트",
		dark: "다크",
		system: "시스템",
		korean: "한국어",
		english: "English",

		// 통계
		statistics: "통계",
		statisticsDescription: "출퇴근 통계를 확인할 수 있습니다",
		totalWorkDays: "총 근무일",
		attendanceRate: "출근률",
		averageClockIn: "평균 출근시간",
		averageClockOut: "평균 퇴근시간",
		overview: "개요",
		details: "상세",
		charts: "차트",
		attendanceStatus: "출근 상태",
		timeAnalysis: "시간 분석",
		performance: "성과",
		earliestClockIn: "가장 빠른 출근",
		latestClockIn: "가장 늦은 출근",
		averageWorkHours: "평균 근무시간",
		onTimeRate: "정시 출근률",
		lateRate: "지각률",
		earlyLeaveRate: "조퇴률",
		dailyDetails: "일별 상세",
		noDataForMonth: "해당 월의 데이터가 없습니다",
		attendanceDistribution: "출근 분포",
		timeTrend: "시간 추이",
		chartComingSoon: "차트 준비 중",
		chartDescription: "곧 차트 기능이 추가됩니다",

		// 메시지
		clockInSuccess: "출근이 기록되었습니다",
		clockOutSuccess: "퇴근이 기록되었습니다",
		locationError: "지정된 출퇴근 장소 범위 밖에 있습니다",
		gpsError: "위치 정보를 가져올 수 없습니다",
		alreadyClockedIn: "오늘 이미 출근했습니다",
		alreadyClockedOut: "오늘 이미 퇴근했습니다",
		todayIsHoliday: "오늘은 공휴일입니다",
	},
	en: {
		// Common
		appName: "Attendance Management",
		login: "Login",
		logout: "Logout",
		loading: "Loading...",
		error: "An error occurred",
		success: "Success",
		cancel: "Cancel",
		confirm: "Confirm",
		save: "Save",
		edit: "Edit",
		delete: "Delete",
		close: "Close",

		// Auth
		signInWithKakao: "Sign in with Kakao",
		welcome: "Welcome",

		// Home
		home: "Home",
		currentTime: "Current Time",
		currentLocation: "Current Location",
		clockIn: "Clock In",
		clockOut: "Clock Out",
		todayRecord: "Today's Attendance Record",
		noRecordToday: "No attendance record for today",
		clockInTime: "Clock In Time",
		clockOutTime: "Clock Out Time",
		workingHours: "Working Hours",

		// Attendance Records
		attendanceRecords: "Attendance Records",
		attendanceRecordsDescription: "View your personal attendance records",
		date: "Date",
		status: "Status",
		normal: "Normal",
		late: "Late",
		earlyLeave: "Early Leave",
		absent: "Absent",
		noRecords: "No attendance records",
		loadMore: "Load More",

		// Admin
		admin: "Admin",
		adminPanel: "Admin Panel",
		adminPanelDescription: "Manage all employees' attendance status",
		workplaceSettings: "Workplace Settings",
		defaultTimes: "Default Times",
		userSettings: "User Settings",
		todayStatus: "Today's Status",
		monthlyRecords: "Monthly Records",
		filterLateEarly: "Filter Late/Early",
		showAll: "Show All",
		totalEmployees: "Total Employees",
		clockedIn: "Clocked In",
		clockedOut: "Clocked Out",
		noRecordsToday: "No attendance records for today",
		noMonthlyRecords: "No monthly records",
		export: "Export",
		addWorkplace: "Add Workplace",
		editWorkplace: "Edit Workplace",
		workplaceName: "Workplace Name",
		latitude: "Latitude",
		longitude: "Longitude",
		radius: "Radius",
		noWorkplaces: "No workplaces registered",
		confirmDelete: "Are you sure you want to delete?",
		add: "Add",
		noUserSettings: "No user settings",
		userSettingsGuide: "Users can be added by the administrator or automatically generated when they first log in.",
		defaultClockIn: "Default Clock In",
		defaultClockOut: "Default Clock Out",

		// Time Settings
		timeSettings: "Time Settings",
		timeSettingsDescription: "Set default and individual user times",
		individualTimes: "Individual Times",
		individualTimesDescription: "Set individual times for each user",
		defaultTimesDescription: "Set default times to be applied to all users",
		applyToAllUsers: "Apply to All Users",
		defaultTimesUpdated: "Default times updated",
		userTimeUpdated: "User time updated",

		// Holiday Management
		holidayManagement: "Holiday Management",
		holidays: "Holidays",
		addHoliday: "Add Holiday",
		editHoliday: "Edit Holiday",
		holidayName: "Holiday Name",
		holidayType: "Holiday Type",
		weeklyHoliday: "Weekly Holiday",
		specificDateHoliday: "Specific Date Holiday",
		weeklyDay: "Day of Week",
		specificDate: "Specific Date",
		description: "Description",
		noHolidays: "No holidays registered",
		sunday: "Sunday",
		monday: "Monday",
		tuesday: "Tuesday",
		wednesday: "Wednesday",
		thursday: "Thursday",
		friday: "Friday",
		saturday: "Saturday",

		// Holiday Management Additional Translations
		holidayManagementComingSoon:
			"Holiday management functionality will be added soon",
		selectHolidayType: "Select Holiday Type",
		selectDayOfWeek: "Select Day of Week",
		enterSpecificDate: "Enter Specific Date",
		enterDescription: "Enter Description (Optional)",

		// Settings
		settings: "Settings",
		theme: "Theme",
		language: "Language",
		light: "Light",
		dark: "Dark",
		system: "System",
		korean: "한국어",
		english: "English",

		// Statistics
		statistics: "Statistics",
		statisticsDescription: "View attendance statistics",
		totalWorkDays: "Total Work Days",
		attendanceRate: "Attendance Rate",
		averageClockIn: "Average Clock In",
		averageClockOut: "Average Clock Out",
		overview: "Overview",
		details: "Details",
		charts: "Charts",
		attendanceStatus: "Attendance Status",
		timeAnalysis: "Time Analysis",
		performance: "Performance",
		earliestClockIn: "Earliest Clock In",
		latestClockIn: "Latest Clock In",
		averageWorkHours: "Average Work Hours",
		onTimeRate: "On Time Rate",
		lateRate: "Late Rate",
		earlyLeaveRate: "Early Leave Rate",
		dailyDetails: "Daily Details",
		noDataForMonth: "No data for this month",
		attendanceDistribution: "Attendance Distribution",
		timeTrend: "Time Trend",
		chartComingSoon: "Charts Coming Soon",
		chartDescription: "Chart functionality will be added soon",

		// Messages
		clockInSuccess: "Clock in recorded successfully",
		clockOutSuccess: "Clock out recorded successfully",
		locationError: "You are outside the designated workplace area",
		gpsError: "Unable to get location information",
		alreadyClockedIn: "Already clocked in today",
		alreadyClockedOut: "Already clocked out today",
		todayIsHoliday: "Today is a holiday",
	},
} as const;

export type TranslationKey = keyof typeof translations.ko;

// React 컴포넌트에서 사용할 훅
export function useTranslation() {
	const language = useAtomValue(languageAtom);

	return {
		t: (key: TranslationKey): string => {
			return translations[language][key] || key;
		},
		language,
	};
}

// 서버 사이드에서 사용할 함수
export function t(key: TranslationKey): string {
	const store = getDefaultStore();
	const language = store.get(languageAtom);
	return translations[language][key] || key;
}
