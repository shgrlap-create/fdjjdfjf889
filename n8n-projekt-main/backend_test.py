#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class CineStarMapsAPITester:
    def __init__(self, base_url="https://starmap-debug.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
            if expected_status and actual_status:
                print(f"   Expected status: {expected_status}, Got: {actual_status}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/", timeout=10)
            success = response.status_code == 200
            details = response.json() if success else f"Status: {response.status_code}"
            self.log_test("API Root", success, str(details), 200, response.status_code)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_magic_link_auth(self):
        """Test magic link authentication flow"""
        try:
            # Step 1: Send magic link
            email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
            response = requests.post(
                f"{self.base_url}/api/auth/magic-link",
                json={"email": email},
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Magic Link Send", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            data = response.json()
            if "demo_token" not in data:
                self.log_test("Magic Link Send", False, "No demo_token in response")
                return False
            
            self.log_test("Magic Link Send", True, "Magic link sent successfully")
            
            # Step 2: Verify magic link
            verify_response = requests.post(
                f"{self.base_url}/api/auth/magic-link/verify",
                json={"token": data["demo_token"]},
                timeout=10
            )
            
            if verify_response.status_code != 200:
                self.log_test("Magic Link Verify", False, f"Status: {verify_response.status_code}", 200, verify_response.status_code)
                return False
            
            user_data = verify_response.json()
            if "user_id" not in user_data:
                self.log_test("Magic Link Verify", False, "No user_id in response")
                return False
            
            # Extract session token from cookies
            if 'Set-Cookie' in verify_response.headers:
                cookies = verify_response.headers['Set-Cookie']
                if 'session_token=' in cookies:
                    # Extract session token
                    start = cookies.find('session_token=') + len('session_token=')
                    end = cookies.find(';', start)
                    if end == -1:
                        end = len(cookies)
                    self.session_token = cookies[start:end]
            
            self.log_test("Magic Link Verify", True, f"User authenticated: {user_data.get('email', 'N/A')}")
            return True
            
        except Exception as e:
            self.log_test("Magic Link Auth", False, str(e))
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        try:
            headers = {}
            if self.session_token:
                headers['Authorization'] = f'Bearer {self.session_token}'
            
            response = requests.get(
                f"{self.base_url}/api/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Auth Me (Unauthenticated)", True, "Correctly returns 401 for unauthenticated request")
                return True
            elif response.status_code == 200:
                user_data = response.json()
                success = "user_id" in user_data and "email" in user_data
                self.log_test("Auth Me (Authenticated)", success, f"User data: {user_data.get('email', 'N/A')}")
                return success
            else:
                self.log_test("Auth Me", False, f"Unexpected status: {response.status_code}", "200 or 401", response.status_code)
                return False
                
        except Exception as e:
            self.log_test("Auth Me", False, str(e))
            return False

    def test_movie_validation(self):
        """Test movie query validation"""
        test_cases = [
            {"query": "Подбери фильм как Интерстеллар, но медленнее", "should_be_valid": True},
            {"query": "хороший фильм", "should_be_valid": False},
            {"query": "asdf", "should_be_valid": False},
            {"query": "Мрачный триллер с неожиданной концовкой", "should_be_valid": True}
        ]
        
        all_passed = True
        for case in test_cases:
            try:
                response = requests.post(
                    f"{self.base_url}/api/movies/validate",
                    json={"query": case["query"]},
                    timeout=15
                )
                
                if response.status_code != 200:
                    self.log_test(f"Validation: '{case['query'][:30]}...'", False, f"Status: {response.status_code}", 200, response.status_code)
                    all_passed = False
                    continue
                
                data = response.json()
                is_valid = data.get("is_valid", False)
                
                if is_valid == case["should_be_valid"]:
                    self.log_test(f"Validation: '{case['query'][:30]}...'", True, f"Correctly validated as {'valid' if is_valid else 'invalid'}")
                else:
                    self.log_test(f"Validation: '{case['query'][:30]}...'", False, f"Expected {case['should_be_valid']}, got {is_valid}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Validation: '{case['query'][:30]}...'", False, str(e))
                all_passed = False
        
        return all_passed

    def test_movie_recommendations(self):
        """Test movie recommendations endpoint"""
        try:
            query = "Подбери фильм как Интерстеллар, но медленнее и без космоса"
            headers = {}
            if self.session_token:
                headers['Authorization'] = f'Bearer {self.session_token}'
            
            response = requests.post(
                f"{self.base_url}/api/movies/recommend",
                json={"query": query},
                headers=headers,
                timeout=30  # AI calls can take longer
            )
            
            if response.status_code != 200:
                self.log_test("Movie Recommendations", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            data = response.json()
            required_fields = ["nodes", "links", "query_summary"]
            
            for field in required_fields:
                if field not in data:
                    self.log_test("Movie Recommendations", False, f"Missing field: {field}")
                    return False
            
            # Check nodes structure
            if not isinstance(data["nodes"], list) or len(data["nodes"]) == 0:
                self.log_test("Movie Recommendations", False, "No nodes in response")
                return False
            
            # Check if nodes have required fields
            node = data["nodes"][0]
            node_fields = ["id", "title", "year", "vibe"]
            for field in node_fields:
                if field not in node:
                    self.log_test("Movie Recommendations", False, f"Node missing field: {field}")
                    return False
            
            # Check links structure
            if not isinstance(data["links"], list):
                self.log_test("Movie Recommendations", False, "Links is not a list")
                return False
            
            self.log_test("Movie Recommendations", True, f"Got {len(data['nodes'])} nodes, {len(data['links'])} links")
            return True
            
        except Exception as e:
            self.log_test("Movie Recommendations", False, str(e))
            return False

    def test_movie_detail(self):
        """Test movie detail endpoint"""
        try:
            # Test with a known movie ID from the mock data
            movie_id = "arrival"
            response = requests.get(f"{self.base_url}/api/movies/{movie_id}", timeout=10)
            
            if response.status_code != 200:
                self.log_test("Movie Detail", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            data = response.json()
            required_fields = ["id", "title", "year", "description", "rating", "watch_providers"]
            
            for field in required_fields:
                if field not in data:
                    self.log_test("Movie Detail", False, f"Missing field: {field}")
                    return False
            
            self.log_test("Movie Detail", True, f"Movie: {data.get('title', 'N/A')} ({data.get('year', 'N/A')})")
            return True
            
        except Exception as e:
            self.log_test("Movie Detail", False, str(e))
            return False

    def test_favorites_flow(self):
        """Test favorites functionality (requires auth)"""
        if not self.session_token:
            self.log_test("Favorites Flow", False, "No session token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.session_token}'}
            
            # Test get favorites (should be empty initially)
            response = requests.get(f"{self.base_url}/api/favorites", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Get Favorites", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            initial_favorites = response.json()
            self.log_test("Get Favorites", True, f"Initial favorites count: {len(initial_favorites)}")
            
            # Test add favorite
            movie_id = "arrival"
            response = requests.post(
                f"{self.base_url}/api/favorites",
                json={"movie_id": movie_id},
                headers=headers,
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_test("Add Favorite", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            favorite_data = response.json()
            if "id" not in favorite_data or favorite_data.get("movie_id") != movie_id:
                self.log_test("Add Favorite", False, "Invalid favorite data returned")
                return False
            
            self.log_test("Add Favorite", True, f"Added movie: {favorite_data.get('movie_title', 'N/A')}")
            
            # Test remove favorite
            response = requests.delete(f"{self.base_url}/api/favorites/{movie_id}", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Remove Favorite", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            self.log_test("Remove Favorite", True, "Successfully removed favorite")
            return True
            
        except Exception as e:
            self.log_test("Favorites Flow", False, str(e))
            return False

    def test_history_flow(self):
        """Test search history functionality (requires auth)"""
        if not self.session_token:
            self.log_test("History Flow", False, "No session token available")
            return False
        
        try:
            headers = {'Authorization': f'Bearer {self.session_token}'}
            
            # Get history
            response = requests.get(f"{self.base_url}/api/history", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Get History", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            history = response.json()
            self.log_test("Get History", True, f"History entries: {len(history)}")
            
            # Clear history
            response = requests.delete(f"{self.base_url}/api/history", headers=headers, timeout=10)
            if response.status_code != 200:
                self.log_test("Clear History", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            self.log_test("Clear History", True, "Successfully cleared history")
            return True
            
        except Exception as e:
            self.log_test("History Flow", False, str(e))
            return False

    def test_specific_review_endpoints(self):
        """Test specific endpoints requested in review"""
        print("\n🎯 Testing Specific Review Endpoints")
        print("-" * 40)
        
        all_passed = True
        
        # 1. GET /api/ - Should return API info
        try:
            response = requests.get(f"{self.base_url}/api/", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                has_message = "message" in data
                self.log_test("GET /api/ - API Info", has_message, f"Response: {data}")
                all_passed = all_passed and has_message
            else:
                self.log_test("GET /api/ - API Info", False, f"Status: {response.status_code}", 200, response.status_code)
                all_passed = False
        except Exception as e:
            self.log_test("GET /api/ - API Info", False, str(e))
            all_passed = False
        
        # 2. POST /api/movies/validate - Send {"query": "Философское кино"}
        try:
            response = requests.post(
                f"{self.base_url}/api/movies/validate",
                json={"query": "Философское кино"},
                timeout=15
            )
            success = response.status_code == 200
            if success:
                data = response.json()
                has_validation = "is_valid" in data
                self.log_test("POST /api/movies/validate - Философское кино", has_validation, f"Validation result: {data}")
                all_passed = all_passed and has_validation
            else:
                self.log_test("POST /api/movies/validate - Философское кино", False, f"Status: {response.status_code}", 200, response.status_code)
                all_passed = False
        except Exception as e:
            self.log_test("POST /api/movies/validate - Философское кино", False, str(e))
            all_passed = False
        
        # 3. POST /api/movies/recommend - Send {"query": "Философское кино"}
        try:
            response = requests.post(
                f"{self.base_url}/api/movies/recommend",
                json={"query": "Философское кино"},
                timeout=30
            )
            success = response.status_code == 200
            if success:
                data = response.json()
                has_nodes = "nodes" in data and isinstance(data["nodes"], list)
                has_links = "links" in data and isinstance(data["links"], list)
                nodes_count = len(data["nodes"]) if has_nodes else 0
                has_min_movies = nodes_count >= 5
                
                details = f"Nodes: {nodes_count}, Links: {len(data['links']) if has_links else 0}"
                test_success = has_nodes and has_links and has_min_movies
                
                self.log_test("POST /api/movies/recommend - Философское кино", test_success, details)
                
                if not has_min_movies:
                    self.log_test("Minimum 5 movies check", False, f"Expected >=5 movies, got {nodes_count}")
                    all_passed = False
                else:
                    self.log_test("Minimum 5 movies check", True, f"Got {nodes_count} movies")
                
                all_passed = all_passed and test_success
            else:
                self.log_test("POST /api/movies/recommend - Философское кино", False, f"Status: {response.status_code}", 200, response.status_code)
                all_passed = False
        except Exception as e:
            self.log_test("POST /api/movies/recommend - Философское кино", False, str(e))
            all_passed = False
        
        # 4. GET /api/movies/arrival - Should return movie details for "Arrival"
        try:
            response = requests.get(f"{self.base_url}/api/movies/arrival", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                required_fields = ["title", "year", "rating", "description"]
                has_all_fields = all(field in data for field in required_fields)
                
                details = f"Title: {data.get('title', 'N/A')}, Year: {data.get('year', 'N/A')}, Rating: {data.get('rating', 'N/A')}"
                self.log_test("GET /api/movies/arrival - Movie Details", has_all_fields, details)
                
                # Check specific field values
                if has_all_fields:
                    title_correct = data.get("title") == "Arrival"
                    year_correct = data.get("year") == 2016
                    has_rating = isinstance(data.get("rating"), (int, float))
                    has_description = len(str(data.get("description", ""))) > 0
                    
                    field_checks = title_correct and year_correct and has_rating and has_description
                    self.log_test("Arrival movie data validation", field_checks, 
                                f"Title correct: {title_correct}, Year correct: {year_correct}, Has rating: {has_rating}, Has description: {has_description}")
                    all_passed = all_passed and field_checks
                else:
                    all_passed = False
            else:
                self.log_test("GET /api/movies/arrival - Movie Details", False, f"Status: {response.status_code}", 200, response.status_code)
                all_passed = False
        except Exception as e:
            self.log_test("GET /api/movies/arrival - Movie Details", False, str(e))
            all_passed = False
        
        return all_passed

    def test_logout(self):
        """Test logout functionality"""
        if not self.session_token:
            self.log_test("Logout", True, "No session to logout from")
            return True
        
        try:
            headers = {'Authorization': f'Bearer {self.session_token}'}
            response = requests.post(f"{self.base_url}/api/auth/logout", headers=headers, timeout=10)
            
            if response.status_code != 200:
                self.log_test("Logout", False, f"Status: {response.status_code}", 200, response.status_code)
                return False
            
            self.log_test("Logout", True, "Successfully logged out")
            self.session_token = None
            return True
            
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting CineStarMaps Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_root():
            print("❌ API Root failed - stopping tests")
            return False
        
        # Run specific review endpoint tests first
        review_success = self.test_specific_review_endpoints()
        
        # Authentication flow
        self.test_magic_link_auth()
        self.test_auth_me()
        
        # Core movie functionality
        self.test_movie_validation()
        self.test_movie_recommendations()
        self.test_movie_detail()
        
        # User features (require auth)
        self.test_favorites_flow()
        self.test_history_flow()
        
        # Cleanup
        self.test_logout()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Special focus on review endpoints
        if review_success:
            print("✅ Review endpoints working correctly")
        else:
            print("❌ Review endpoints have issues")
        
        if success_rate >= 80:
            print("✅ Backend tests mostly successful")
            return True
        else:
            print("❌ Backend has significant issues")
            return False

def main():
    tester = CineStarMapsAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())