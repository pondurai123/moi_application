import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';

interface PublicSettings {
    brandName?: string;
    brandContact?: string;
    contactUsContentEn?: string;
    contactUsContentTa?: string;
}

export default function HomePage() {
    const { t, lang } = useLanguage();
    const [settings, setSettings] = useState<PublicSettings>({});

    useEffect(() => {
        client.get('/settings').then((res) => setSettings(res.data)).catch(() => {
            setSettings({});
        });
    }, []);

    const contactContent = lang === 'ta' ? settings.contactUsContentTa : settings.contactUsContentEn;

    return (
        <div className="marketing-page">
            <div className="marketing-border-ornament" />

            <section className="marketing-hero">
                <div className="marketing-hero-bg-pattern" />
                <div className="container marketing-hero-shell">
                    <div className="marketing-kolam">✦ ✦ ✦ ✦ ✦</div>
                    <p className="marketing-eyebrow">{t.marketing.eyebrow}</p>
                    <h1 className="marketing-main-title">
                        {t.marketing.heroLineOne}
                        <br />
                        <span>{t.marketing.heroLineHighlight}</span>
                        <br />
                        {t.marketing.heroLineThree}
                    </h1>
                    <div className="marketing-divider" />
                    <p className="marketing-subtitle-ta">{t.marketing.serviceTamil}</p>
                    <p className="marketing-subtitle-en">{t.marketing.serviceEnglish}</p>
                    <div className="marketing-actions">
                        <a href="#functions" className="btn btn-primary btn-lg">{t.marketing.primaryAnchor}</a>
                        <a href="#how" className="btn btn-outline btn-lg">{t.marketing.howAnchor}</a>
                    </div>
                </div>
            </section>

            <section className="marketing-functions" id="functions">
                <div className="container marketing-section-shell">
                    <div className="section-ornament">- ✦ -</div>
                    <p className="section-label">{t.marketing.functionsLabel}</p>
                    <h2 className="section-title">{t.marketing.functionsTitleTa}</h2>
                    <p className="section-title-sub">{t.marketing.functionsTitleEn}</p>
                    <div className="marketing-function-grid marketing-function-grid-full">
                        <div className="marketing-function-card"><span>💍</span><strong>{t.marketing.functionMarriage}</strong><em>{t.marketing.functionMarriageTa}</em></div>
                        <div className="marketing-function-card"><span>💛</span><strong>{t.marketing.functionEngagement}</strong><em>{t.marketing.functionEngagementTa}</em></div>
                        <div className="marketing-function-card"><span>👶</span><strong>{t.marketing.functionBabyShower}</strong><em>{t.marketing.functionBabyShowerTa}</em></div>
                        <div className="marketing-function-card"><span>🎂</span><strong>{t.marketing.functionBirthday}</strong><em>{t.marketing.functionBirthdayTa}</em></div>
                        <div className="marketing-function-card"><span>🎓</span><strong>{t.marketing.functionGraduation}</strong><em>{t.marketing.functionGraduationTa}</em></div>
                        <div className="marketing-function-card"><span>🏠</span><strong>{t.marketing.functionHouseWarming}</strong><em>{t.marketing.functionHouseWarmingTa}</em></div>
                    </div>
                </div>
            </section>

            <section className="marketing-features" id="features">
                <div className="container marketing-section-shell">
                    <div className="section-ornament">- ✦ -</div>
                    <p className="section-label">{t.marketing.featuresLabel}</p>
                    <h2 className="section-title">{t.marketing.featuresTitleTa}</h2>
                    <p className="section-title-sub">{t.marketing.featuresTitleEn}</p>
                    <div className="marketing-features-grid">
                        <article className="marketing-feature-item">
                            <div className="marketing-feature-head"><i className="dot gold" /><span>{t.marketing.featureOneTitle}</span></div>
                            <em>{t.marketing.featureOneTitleTa}</em>
                            <p>{t.marketing.featureOneBody}</p>
                        </article>
                        <article className="marketing-feature-item">
                            <div className="marketing-feature-head"><i className="dot orange" /><span>{t.marketing.featureTwoTitle}</span></div>
                            <em>{t.marketing.featureTwoTitleTa}</em>
                            <p>{t.marketing.featureTwoBody}</p>
                        </article>
                        <article className="marketing-feature-item">
                            <div className="marketing-feature-head"><i className="dot maroon" /><span>{t.marketing.featureThreeTitle}</span></div>
                            <em>{t.marketing.featureThreeTitleTa}</em>
                            <p>{t.marketing.featureThreeBody}</p>
                        </article>
                        <article className="marketing-feature-item">
                            <div className="marketing-feature-head"><i className="dot green" /><span>{t.marketing.featureFourTitle}</span></div>
                            <em>{t.marketing.featureFourTitleTa}</em>
                            <p>{t.marketing.featureFourBody}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="marketing-how" id="how">
                <div className="container marketing-section-shell">
                    <div className="section-ornament">- ✦ -</div>
                    <p className="section-label">{t.marketing.howLabel}</p>
                    <h2 className="section-title">{t.marketing.howTitleTa}</h2>
                    <p className="section-title-sub">{t.marketing.howTitleEn}</p>
                    <div className="marketing-steps-grid">
                        <article className="marketing-step-card">
                            <div className="marketing-step-num">01</div>
                            <strong>{t.marketing.stepOneTitle}</strong>
                            <em>{t.marketing.stepOneTitleTa}</em>
                            <p>{t.marketing.stepOneBody}</p>
                        </article>
                        <article className="marketing-step-card">
                            <div className="marketing-step-num">02</div>
                            <strong>{t.marketing.stepTwoTitle}</strong>
                            <em>{t.marketing.stepTwoTitleTa}</em>
                            <p>{t.marketing.stepTwoBody}</p>
                        </article>
                        <article className="marketing-step-card">
                            <div className="marketing-step-num">03</div>
                            <strong>{t.marketing.stepThreeTitle}</strong>
                            <em>{t.marketing.stepThreeTitleTa}</em>
                            <p>{t.marketing.stepThreeBody}</p>
                        </article>
                        <article className="marketing-step-card">
                            <div className="marketing-step-num">04</div>
                            <strong>{t.marketing.stepFourTitle}</strong>
                            <em>{t.marketing.stepFourTitleTa}</em>
                            <p>{t.marketing.stepFourBody}</p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="marketing-cta" id="contact">
                <div className="marketing-cta-bg" />
                <div className="container marketing-cta-shell">
                    <h2>{t.marketing.ctaTitle}</h2>
                    <p className="marketing-cta-subtitle">{t.marketing.ctaSubtitle}</p>
                    <div className="marketing-actions">
                        <Link to="/contact" className="btn btn-primary btn-lg">{t.marketing.secondaryCta}</Link>
                    </div>
                    <div className="marketing-contact-row">
                        <div className="marketing-contact-item">{contactContent || settings.brandContact || t.marketing.contactFallback}</div>
                    </div>
                </div>
            </section>

            <div className="marketing-border-ornament" />

            <footer className="site-footer">
                <div className="container site-footer-centered">
                    <p>{settings.brandName || t.app.title} · <span>{t.marketing.footerBrand}</span></p>
                    <p>{t.marketing.footerTaglineTa}</p>
                    <div className="site-footer-links site-footer-links-centered">
                        <Link to="/about">{t.marketing.aboutTitle}</Link>
                        <Link to="/terms">{t.marketing.termsShort}</Link>
                        <Link to="/privacy">{t.marketing.privacyShort}</Link>
                        <Link to="/contact">{t.marketing.contactShort}</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
