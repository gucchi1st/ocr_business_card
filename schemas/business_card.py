from typing import Optional

from pydantic import BaseModel


class BusinessCard(BaseModel):
    name: Optional[str] = None
    job_title: Optional[str] = None

    company_vietnamese: Optional[str] = None
    company_english: Optional[str] = None

    tel_1: Optional[str] = None
    tel_2: Optional[str] = None

    mobile_1: Optional[str] = None
    mobile_2: Optional[str] = None

    email_1: Optional[str] = None
    email_2: Optional[str] = None

    website: Optional[str] = None

    address: Optional[str] = None
    province: Optional[str] = None
    country: Optional[str] = None

    industry: Optional[str] = None
    sector: Optional[str] = None