import requests
import json
import time
import logging
from bs4 import BeautifulSoup
import re
from datetime import datetime
import random
import sys
from tqdm import tqdm  # For progress bars
from playwright.sync_api import sync_playwright

# Configure logging
logging.basicConfig(
    level=logging.WARNING,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


class RateLimiter:
    def __init__(self, delay):
        self.delay = delay
        self.last_request = 0

    def wait(self):
        since_last = time.time() - self.last_request
        if since_last < self.delay:
            time.sleep(self.delay - since_last)
        self.last_request = time.time()

playwright_browser = None
arxiv_limiter = RateLimiter(3)  # Reduced from 5s to 3s since we're using browser
openreview_limiter = RateLimiter(2)
acl_limiter = RateLimiter(2)
mlr_limiter = RateLimiter(2)
neurips_limiter = RateLimiter(2)

def init_playwright():
    global playwright_browser
    if not playwright_browser:
        playwright = sync_playwright().start()
        browser = playwright.chromium.launch(headless=False)
        playwright_browser = {
            'playwright': playwright,
            'browser': browser
        }
    return playwright_browser

def close_playwright():
    global playwright_browser
    if playwright_browser:
        playwright_browser['browser'].close()
        playwright_browser['playwright'].stop()
        playwright_browser = None

def safe_request(url, max_retries=5):
    for attempt in range(max_retries):
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (project_name; mailto:your-email@example.com) Python/3.x requests/2.x',
            }
            response = requests.get(url, timeout=15, headers=headers)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            if attempt < max_retries - 1:
                # Exponential backoff with jitter
                wait_time = min(30, (2 ** attempt) + (random.randint(0, 1000) / 1000.0))
                logging.warning(f"Request failed: {e}. Retrying in {wait_time:.2f}s...")
                time.sleep(wait_time)
            else:
                logging.error(f"Failed after {max_retries} attempts: {e}")
                return None

def get_arxiv_info(arxiv_id):
    try:
        arxiv_limiter.wait()
        browser_data = init_playwright()
        browser = browser_data['browser']
        
        # Create a new context for isolation
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the arXiv page
        url = f"https://arxiv.org/abs/{arxiv_id}"
        page.goto(url, wait_until="networkidle")
        
        # Extract the needed information
        info = {}
        
        # Date (from the submission history)
        try:
            # Check the dateline or submission history section
            date_element = page.query_selector(".dateline") or page.query_selector(".submission-history")
            if date_element:
                date_text = date_element.text_content()
                
                # First try to find the original submission date with the format:
                # "[Submitted on 11 Oct 2023 (v1), last revised 14 Dec 2024 (this version, v4)]"
                submission_match = re.search(r'Submitted on (\d{1,2} [A-Za-z]+ \d{4})', date_text)
                if submission_match:
                    date_str = submission_match.group(1)
                    try:
                        date_obj = datetime.strptime(date_str, "%d %b %Y")
                        info['date'] = date_obj.strftime("%Y-%m")
                    except ValueError:
                        logging.warning(f"Could not parse submission date format for {arxiv_id}: {date_str}")
                # Fallback to other patterns if original submission not found
                else:
                    # Try older format patterns
                    date_match = re.search(r'\[(?:Submitted|v\d+)\s+on\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})\]', date_text)
                    if not date_match:
                        date_match = re.search(r'\[v\d+\]\s+\w+,\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})', date_text)
                    
                    if date_match:
                        date_str = date_match.group(1)
                        try:
                            date_obj = datetime.strptime(date_str, "%d %b %Y")
                            info['date'] = date_obj.strftime("%Y-%m")
                        except ValueError:
                            logging.warning(f"Could not parse date format for {arxiv_id}: {date_str}")
                    else:
                        # Extract any date in the format "DD Mon YYYY"
                        any_date_match = re.search(r'(\d{1,2} [A-Za-z]+ \d{4})', date_text)
                        if any_date_match:
                            date_str = any_date_match.group(1)
                            try:
                                date_obj = datetime.strptime(date_str, "%d %b %Y")
                                info['date'] = date_obj.strftime("%Y-%m")
                                logging.info(f"Using first date found in dateline: {date_str}")
                            except ValueError:
                                logging.warning(f"Could not parse any date format for {arxiv_id}: {date_str}")
                        else:
                            logging.warning(f"Could not find any date pattern in: {date_text}")
            else:
                logging.warning(f"No date element found for {arxiv_id}")
        except Exception as e:
            logging.warning(f"Error extracting arXiv date: {e}")
        
        # Authors
        try:
            authors = []
            # Try the modern class structure first
            author_elements = page.query_selector_all(".authors a")
            if not author_elements or len(author_elements) == 0:
                # Try alternative selectors if needed
                author_elements = page.query_selector_all(".metatable .authors a")
            
            for author_elem in author_elements:
                author_name = author_elem.text_content().strip()
                if author_name:
                    authors.append(author_name)
            
            info['authors'] = authors if authors else None
        except Exception as e:
            logging.warning(f"Error extracting arXiv authors: {e}")
        
        # Abstract
        try:
            # Try the modern class structure first
            abstract_elem = page.query_selector(".abstract")
            if abstract_elem:
                abstract_text = abstract_elem.text_content()
                # Remove the "Abstract: " prefix if present
                abstract_text = re.sub(r'^Abstract:\s*', '', abstract_text).strip().replace('Abstract:', '').strip()
                info['abstract'] = abstract_text
            else:
                # Try alternative selectors
                abstract_elem = page.query_selector("blockquote.abstract")
                if abstract_elem:
                    # The span with class "descriptor" contains "Abstract:" text which we want to exclude
                    descriptor = abstract_elem.query_selector(".descriptor")
                    if descriptor:
                        descriptor_text = descriptor.text_content()
                        abstract_text = abstract_elem.text_content()
                        # Remove the descriptor text from the abstract
                        abstract_text = abstract_text.replace(descriptor_text, "").strip()
                        info['abstract'] = abstract_text
        except Exception as e:
            logging.warning(f"Error extracting arXiv abstract: {e}")
        
        # Close the context to free resources
        context.close()
        
        return info

    except Exception as e:
        logging.error(f"Error processing arXiv data: {e}")
        return None

def get_openreview_info(openreview_id):
    try:
        openreview_limiter.wait()
        browser_data = init_playwright()
        browser = browser_data['browser']
        
        # Create a new context for isolation
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the OpenReview page with a more reliable load strategy
        url = f"https://openreview.net/forum?id={openreview_id}"
        
        # First navigate with domcontentloaded which is faster
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        
        # Then wait for critical elements to appear rather than networkidle
        try:
            # Wait for either the forum content to load OR the error message if paper doesn't exist
            page.wait_for_selector("div.forum-container, div.error-container", timeout=20000)
            
            # Additional wait for the authors to appear if the page exists
            authors_selector = page.query_selector(".forum-authors, div:has-text('Authors:')")
            if authors_selector:
                # Give a little more time for content to settle
                page.wait_for_timeout(1000)
        except Exception as e:
            logging.warning(f"Timeout waiting for OpenReview page elements: {e}")
            # Continue anyway with what we have
        
        # Extract the needed information
        info = {}
        
        # Extract date
        try:
            # Look for the publication date in the forum-meta section
            date_span = page.query_selector(".forum-meta .date")
            if date_span:
                date_text = date_span.text_content()
                year_match = re.search(r'(\d{4})', date_text)
                if year_match:
                    info['date'] = year_match.group(1)
            
            # Fallback: Look for date in other potential locations
            if not info.get('date'):
                date_div = page.query_selector('div:has-text("Date:") + div')
                if date_div:
                    date_text = date_div.text_content()
                    year_match = re.search(r'\d{4}', date_text)
                    info['date'] = year_match.group(0) if year_match else None
        except Exception as e:
            logging.warning(f"Error extracting OpenReview date: {e}")

        # Extract authors
        try:
            # Try forum-authors class first (modern layout)
            authors = []
            author_elements = page.query_selector_all(".forum-authors a")
            
            # If no authors found, try alternative layout
            if not author_elements or len(author_elements) == 0:
                authors_div = page.query_selector('div:has-text("Authors:") + div')
                if authors_div:
                    authors_text = authors_div.text_content()
                    # Split by commas and clean up
                    authors = [a.strip() for a in authors_text.split(',')]
            else:
                # Extract from forum-authors elements
                for author_elem in author_elements:
                    author_name = author_elem.text_content().strip()
                    if author_name:
                        authors.append(author_name)
            
            info['authors'] = authors if authors else None
        except Exception as e:
            logging.warning(f"Error extracting OpenReview authors: {e}")

        # Extract abstract
        try:
            # Try the note-content-value with markdown-rendered class first
            abstract_div = page.query_selector('div:has(.note-content-field:has-text("Abstract:")) .note-content-value.markdown-rendered')
            if abstract_div:
                abstract = abstract_div.text_content().strip()
                info['abstract'] = abstract if abstract else None
            else:
                # Try alternative layout
                abstract_div = page.query_selector('div:has-text("Abstract:") + div')
                if abstract_div:
                    abstract = abstract_div.text_content().strip()
                    info['abstract'] = abstract if abstract else None
        except Exception as e:
            logging.warning(f"Error extracting OpenReview abstract: {e}")
        
        # Close the context to free resources
        context.close()
        
        return info

    except Exception as e:
        logging.error(f"Error processing OpenReview data: {e}")
        return None

def get_acl_info(acl_id):
    try:
        acl_limiter.wait()
        browser_data = init_playwright()
        browser = browser_data['browser']
        
        # Create a new context for isolation
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the ACL Anthology page
        url = f"https://aclanthology.org/{acl_id}/"
        page.goto(url, wait_until="networkidle")
        
        # Extract the needed information
        info = {}
        
        # Extract year
        try:
            # Look for year information in the dl section
            year_element = page.query_selector('dt:has-text("Year:") + dd')
            if year_element:
                info['date'] = year_element.text_content().strip()
            
            # If not found, try to find in any element with year pattern
            if not info.get('date'):
                # Try to find from the BibTeX content
                bibtex_elem = page.query_selector('#citeBibtexContent')
                if bibtex_elem:
                    bibtex_text = bibtex_elem.text_content()
                    year_match = re.search(r'year\s*=\s*\{(\d{4})', bibtex_text)
                    if year_match:
                        info['date'] = year_match.group(1)
                
                # As a fallback, try to extract from the anthology ID
                if not info.get('date') and acl_id:
                    # ACL IDs often contain year information (e.g., 2024.acl-long.572)
                    year_match = re.search(r'(\d{4})', acl_id)
                    if year_match:
                        info['date'] = year_match.group(1)
        except Exception as e:
            logging.warning(f"Error extracting ACL year: {e}")
        
        # Extract authors
        try:
            authors = []
            # Try author links in lead paragraph
            author_elements = page.query_selector_all('p.lead a')
            if author_elements and len(author_elements) > 0:
                for author_elem in author_elements:
                    author_name = author_elem.text_content().strip()
                    if author_name and author_name not in ['', ',']:
                        authors.append(author_name)
            
            # If not found, try to extract from BibTeX
            if not authors:
                bibtex_elem = page.query_selector('#citeBibtexContent')
                if bibtex_elem:
                    bibtex_text = bibtex_elem.text_content()
                    author_match = re.search(r'author\s*=\s*\{([^}]+)\}', bibtex_text)
                    if author_match:
                        authors_text = author_match.group(1)
                        # Handle different formats: "and" or "," separators
                        authors_text = authors_text.replace(' and ', ', ')
                        authors = [author.strip() for author in authors_text.split(',')]
            
            # Filter out empty author names and store
            authors = [a for a in authors if a]
            if authors:
                info['authors'] = authors
        except Exception as e:
            logging.warning(f"Error extracting ACL authors: {e}")
        
        # Extract abstract
        try:
            # Try the abstract section
            abstract_div = page.query_selector('div.acl-abstract span')
            if abstract_div:
                abstract_text = abstract_div.text_content().strip()
                if abstract_text:
                    info['abstract'] = abstract_text
            
            # If not found, try to extract from BibTeX
            if not info.get('abstract'):
                bibtex_elem = page.query_selector('#citeBibtexContent')
                if bibtex_elem:
                    bibtex_text = bibtex_elem.text_content()
                    abstract_match = re.search(r'abstract\s*=\s*\{([^}]+)\}', bibtex_text)
                    if abstract_match:
                        info['abstract'] = abstract_match.group(1).strip()
        except Exception as e:
            logging.warning(f"Error extracting ACL abstract: {e}")
        
        # Close the context to free resources
        context.close()
        
        return info

    except Exception as e:
        logging.error(f"Error processing ACL data: {e}")
        return None

def get_mlr_info(mlr_id):
    try:
        mlr_limiter.wait()
        browser_data = init_playwright()
        browser = browser_data['browser']
        
        # Create a new context for isolation
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the MLR page
        url = f"https://proceedings.mlr.press/{mlr_id}"
        page.goto(url, wait_until="networkidle")
        
        # Extract the needed information
        info = {}
        
        # Extract date/year
        try:
            # Check bibtex for date information
            bibtex_elem = page.query_selector('#bibtex')
            if bibtex_elem:
                bibtex_text = bibtex_elem.text_content()
                year_match = re.search(r'year\s*=\s*\{(\d{4})\}', bibtex_text)
                if year_match:
                    info['date'] = year_match.group(1)
            
            # Fallback to info div
            if not info.get('date'):
                info_div = page.query_selector('#info')
                if info_div:
                    info_text = info_div.text_content()
                    year_match = re.search(r'(\d{4})', info_text)
                    if year_match:
                        info['date'] = year_match.group(1)
        except Exception as e:
            logging.warning(f"Error extracting MLR date: {e}")
        
        # Extract authors
        try:
            # Look for authors in the span.authors element
            authors_span = page.query_selector('span.authors')
            if authors_span:
                authors_text = authors_span.text_content().strip()
                # Split by commas and ampersands
                authors_text = authors_text.replace('&', ',')
                authors = [author.strip() for author in authors_text.split(',')]
                # Filter out empty strings
                authors = [author for author in authors if author]
                info['authors'] = authors if authors else None
                
            # Fallback to bibtex
            if not info.get('authors'):
                bibtex_elem = page.query_selector('#bibtex')
                if bibtex_elem:
                    bibtex_text = bibtex_elem.text_content()
                    author_match = re.search(r'author\s*=\s*\{([^}]+)\}', bibtex_text)
                    if author_match:
                        authors_text = author_match.group(1)
                        # Handle different formats: "and" or "," separators
                        authors_text = authors_text.replace(' and ', ', ')
                        authors = [author.strip() for author in authors_text.split(',')]
                        info['authors'] = authors if authors else None
        except Exception as e:
            logging.warning(f"Error extracting MLR authors: {e}")
        
        # Extract abstract
        try:
            abstract_div = page.query_selector('#abstract')
            if abstract_div:
                abstract_text = abstract_div.text_content().strip()
                info['abstract'] = abstract_text if abstract_text else None
            
            # Fallback to bibtex
            if not info.get('abstract'):
                bibtex_elem = page.query_selector('#bibtex')
                if bibtex_elem:
                    bibtex_text = bibtex_elem.text_content()
                    abstract_match = re.search(r'abstract\s*=\s*\{([^}]+)\}', bibtex_text)
                    if abstract_match:
                        info['abstract'] = abstract_match.group(1)
        except Exception as e:
            logging.warning(f"Error extracting MLR abstract: {e}")
            
        # Close the context to free resources
        context.close()
        
        return info

    except Exception as e:
        logging.error(f"Error processing MLR data: {e}")
        return None

def get_neurips_info(neurips_id):
    try:
        neurips_limiter.wait()
        browser_data = init_playwright()
        browser = browser_data['browser']
        
        # Create a new context for isolation
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to the NeurIPS page
        url = f"https://proceedings.neurips.cc/paper/{neurips_id}"
        page.goto(url, wait_until="networkidle")
        
        # Extract the needed information
        info = {}
        
        # Extract year/date
        try:
            # Look for year in the conference link
            conference_link = page.query_selector('a[href*="/paper_files/paper/"]')
            if conference_link:
                link_text = conference_link.text_content().strip()
                year_match = re.search(r'NeurIPS\s+(\d{4})', link_text, re.IGNORECASE)
                if year_match:
                    info['date'] = year_match.group(1)
            
            # Fallback: extract from URL or paper ID
            if not info.get('date'):
                # Try to extract from the paper URL
                year_match = re.search(r'/paper/(\d{4})/', neurips_id)
                if year_match:
                    info['date'] = year_match.group(1)
                # Try to extract from the conference link href
                elif conference_link:
                    href = conference_link.get_attribute('href')
                    if href:
                        year_match = re.search(r'/paper_files/paper/(\d{4})/?', href)
                        if year_match:
                            info['date'] = year_match.group(1)
        except Exception as e:
            logging.warning(f"Error extracting NeurIPS year: {e}")
        
        # Extract authors
        try:
            # Try to find the authors section
            authors_p = page.query_selector('h4:has-text("Authors") + p')
            if authors_p:
                authors_text = authors_p.text_content().strip()
                # Remove italic formatting if present
                authors_text = authors_text.replace('<i>', '').replace('</i>', '')
                # Split by commas and handle possible "and" between last two authors
                if ' and ' in authors_text:
                    parts = authors_text.split(' and ')
                    if ',' in parts[0]:
                        # There are multiple authors with commas
                        authors_before_and = parts[0].split(',')
                        authors = [a.strip() for a in authors_before_and] + [parts[1].strip()]
                    else:
                        # Just two authors separated by "and"
                        authors = [parts[0].strip(), parts[1].strip()]
                else:
                    # Split by commas
                    authors = [a.strip() for a in authors_text.split(',')]
                
                # Filter out empty strings and remove any HTML tags
                authors = [re.sub(r'<[^>]+>', '', a) for a in authors if a]
                info['authors'] = authors if authors else None
        except Exception as e:
            logging.warning(f"Error extracting NeurIPS authors: {e}")
        
        # Extract abstract
        try:
            # Find the abstract section
            abstract_p = page.query_selector('h4:has-text("Abstract") + p')
            if abstract_p:
                abstract_text = abstract_p.text_content().strip()
                # Clean up MathJax elements if needed
                abstract_text = re.sub(r'<span class="MathJax[^>]+>.*?</span>', '', abstract_text)
                info['abstract'] = abstract_text
        except Exception as e:
            logging.warning(f"Error extracting NeurIPS abstract: {e}")
        
        # Close the context to free resources
        context.close()
        
        return info

    except Exception as e:
        logging.error(f"Error processing NeurIPS data: {e}")
        return None


def get_url_type(urls):
    type = None
    for k, v in urls.items():
        if 'arxiv' in v.lower():
            type = 'arxiv'
        elif 'openreview' in v.lower():
            type = 'openreview'
        elif 'aclanthology' in v.lower():
            type = 'acl'
        elif 'mlr' in v.lower():
            type = 'mlr'
        elif 'neurips' in v.lower():
            type = 'neurips'
        # just return the first one
        return type, v


def update_paper_info(paper):
    try:
        if all(paper.get(field) for field in ['date', 'authors', 'abstract']):
            return paper

        urls = paper.get('urls', {})
        type, url = get_url_type(urls)
        updated = False

        # Define handler configuration
        handlers = [
            {
                'type': 'arxiv',
                'url_pattern': r'arxiv\.org/abs/(\d+\.\d+)',
                'id_group': 1,
                'info_func': get_arxiv_info
            },
            {
                'type': 'openreview',
                'url_pattern': r'id=([A-Za-z0-9]+)$',
                'id_group': 1,
                'info_func': get_openreview_info
            },
            {
                'type': 'acl',
                'url_pattern': r'aclanthology\.org/([A-Z0-9\-\.]+)/?$',
                'id_group': 1,
                'info_func': get_acl_info
            },
            {
                'type': 'mlr',
                'url_pattern': r'proceedings\.mlr\.press/([a-zA-Z0-9\/\-]+)',
                'id_group': 1,
                'info_func': get_mlr_info
            },
            {
                'type': 'neurips',
                'url_pattern': r'neurips\.cc/paper_files/paper/(\d+/[^/]+/[^/]+)',
                'id_group': 1,
                'info_func': get_neurips_info
            }
        ]

        def extract_id(pattern, url, group):
            match = re.search(pattern, url)
            return match.group(group) if match else None

        for handler in handlers:
            if updated or type != handler['type']:
                continue
                
            try:
                paper_id = extract_id(handler['url_pattern'], url, handler['id_group'])
                if not paper_id:
                    continue
                
                if info := handler['info_func'](paper_id):
                    for field in ['date', 'authors', 'abstract']:
                        if not paper.get(field) and info.get(field):
                            paper[field] = info[field]
                            updated = True
            except Exception as e:
                logging.error(f"Error processing {handler['type'].title()} URL {url}: {e}")

        return paper

    except Exception as e:
        logging.error(f"Error updating paper {paper.get('id')}: {e}")
        return paper



if __name__ == "__main__":
    try:
        with open('papers.json', 'r') as f:
            papers = json.load(f)
        
        logging.info(f"Processing {len(papers)} papers...")
        updated_papers = []
        for paper in tqdm(papers, desc="Updating paper info"):
            updated_papers.append(update_paper_info(paper))
        
        with open('papers_updated.json', 'w') as f:
            json.dump(updated_papers, f, indent=2, ensure_ascii=False)
            
        logging.info("Successfully updated papers data")
        
        close_playwright()
        
    except Exception as e:
        logging.error(f"Fatal error in main execution: {e}")
        close_playwright()
