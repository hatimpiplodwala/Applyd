from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Status = Literal[
    "Applied",
    "Phone Screen",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
]


def _validate_http_url(value: str | None) -> str | None:
    if value is None or value == "":
        return None
    lower = value.strip().lower()
    if not (lower.startswith("http://") or lower.startswith("https://")):
        raise ValueError("job_url must start with http:// or https://")
    return value


class ApplicationBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    status: Status = "Applied"
    date_applied: date
    job_url: str | None = None
    salary_range: str | None = Field(default=None, max_length=100)
    contact_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    follow_up_date: date | None = None

    _validate_job_url = field_validator("job_url")(_validate_http_url)


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=200)
    location: str | None = Field(default=None, max_length=200)
    status: Status | None = None
    date_applied: date | None = None
    job_url: str | None = None
    salary_range: str | None = Field(default=None, max_length=100)
    contact_name: str | None = Field(default=None, max_length=200)
    notes: str | None = Field(default=None, max_length=5000)
    follow_up_date: date | None = None

    _validate_job_url = field_validator("job_url")(_validate_http_url)


class Application(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class DuplicateCheck(BaseModel):
    exists: bool


MAX_URL_CHARS = 2048
MAX_PASTED_TEXT_CHARS = 50_000


class ParseRequest(BaseModel):
    url: str | None = Field(default=None, max_length=MAX_URL_CHARS)
    text: str | None = Field(default=None, max_length=MAX_PASTED_TEXT_CHARS)

    @model_validator(mode="after")
    def _one_of(self) -> "ParseRequest":
        has_url = bool(self.url and self.url.strip())
        has_text = bool(self.text and self.text.strip())
        if has_url == has_text:  # both or neither
            raise ValueError("Provide exactly one of url or text")
        return self


class ParseUrlResponse(BaseModel):
    company: str | None = None
    role: str | None = None
    location: str | None = None
    salary_range: str | None = None
    job_url: str | None = None
