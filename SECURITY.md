## DFX Finance's Security Process

This document describes the Security Process for DFX Finance, including vulnerability disclosures and its [Bug Bounty program](#bug-bounty-program). We are committed to conduct our Security Process in a professional and civil manner. Public shaming, under-reporting, or misrepresentation of vulnerabilities will not be tolerated.

To submit a finding, please follow the steps outlined in receiving disclosures [section](#receiving-disclosures).

## Responsible Disclosure Standard

DFX Finance follows a community [standard](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#the-standard) for responsible disclosure in cryptocurrency and related software. This document is a public commitment to
following the standard.

This standard provides detailed information for:

- [Initial Contact](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#initial-contact): how to establish initial contact with DFX Finance's security team.
- [Giving Details](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#giving-details): what details to include with your vulnerability disclosure after having received a response to your initial contact.
- [Setting Dates](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#setting-dates): how to agree on timelines for releasing updates and making details of the issue public.

Any expected deviations and necessary clarifications around the standard are explained in the following sections.

## Receiving Disclosures

DFX Finance is committed to working with researchers who submit security vulnerability notifications to us, to resolve those issues on an appropriate timeline, and to perform a coordinated release, giving credit to the reporter if they would so like.

Please submit issues to **all** of the following main points of contact for
security related issues according to the
[initial contact](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#initial-contact) and [giving details](https://github.com/RD-Crypto-Spec/Responsible-Disclosure#giving-details) guidelines.

For all security related issues, DFX Finance has four main points of contact:

| Contact      | Public key                                                                   | Email                   |
| ------------ | ---------------------------------------------------------------------------- | ----------------------- |
| Kendrick Tan | [PGP](https://gist.github.com/kendricktan/80b89b5b7e6e76ba0eaa9abe746d2059)  | kendrick at dfx.finance |
| Adrian Li    | [PGP](https://gist.github.com/adrianmcli/18f80733da56c41541dd81e4a6a7a0f1)   | adrian at dfx.finance   |
| Kevin Zhang  | [PGP](https://gist.github.com/kevinzhangTO/2828507836e2e1cacd05c9185a0670d9) | kevin at dfx.finance    |

Include all contacts in your communication, PGP encrypted to all parties.

You can also reach out informally over Discord or Twitter to one or more of the above contacts if you need help on sending the info via secure e-mail.

## Sending Disclosures

In the case where we become aware of security issues affecting other projects that has never affected DFX Finance, our intention is to inform those projects of security issues on a best effort basis.

In the case where we fix a security issue in DFX Finance that also affects the following neighboring projects, our intention is to engage in responsible disclosures with them as described in the adopted [standard](https://github.com/RD-Crypto-Spec/Responsible-Disclosure), subject to the deviations described in the deviations [section](#deviations-from-the-standard) of this document.

## Bilateral Responsible Disclosure Agreements

_DFX Finance does not currently have any established bilateral disclosure agreements._

## Bug Bounty Program

DFX Finance has a Bug Bounty program to encourage security researchers to spend time studying the protocol in order to uncover vulnerabilities. We believe these researchers should get fairly compensated for their time and effort, and acknowledged for their valuable contributions.

### Rules

1. Bug has not been publicly disclosed.
2. Vulnerabilities that have been previously submitted by another contributor or already known by the DFX Finance development team are not eligible for rewards.
3. The size of the bounty payout depends on the assessment of the severity of the exploit. Please refer to the rewards [section](#rewards) below for additional details.
4. Bugs must be reproducible in order for us to verify the vulnerability.
5. Rewards and the validity of bugs are determined by the DFX Finance security team and any payouts are made at their sole discretion.
6. Terms and conditions of the Bug Bounty program can be changed at any time at the discretion of DFX Finance.
7. Details of any valid bugs may be shared with complementary protocols utilized in the DFX Finance ecosystem in order to promote ecosystem cohesion and safety.

### Classifications

- **Severe:** Highly likely to have a material impact on availability, integrity, and/or loss of funds.
- **High:** Likely to have impact on availability, integrity, and/or loss of funds.
- **Medium:** Possible to have an impact on availability, integrity, and/or loss of funds.
- **Low:** Unlikely to have a meaningful impact on availability, integrity, and/or loss of funds.

### Rewards

- **Severe:** 20,000-50,000 USDC
- **High:** 5,000-20,000 USDC
- **Medium:** 1,000-5,000 USDC
- **Low:** 100-1,000 USDC

Actual payouts are determined by classifying the vulnerability based on its impact and likelihood to be exploited successfully, as well as the process working with the disclosing security researcher. The rewards represent the _maximum_ that will be paid out for a disclosure.

Rewards are paid out in [USDC](https://etherscan.io/token/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174).

### Scope

The scope of the Bug Bounty program spans smart contracts utilized in the DFX Finance ecosystem.

Note: Other contracts, outside of the ones mentioned above, might be considered on a case by case basis, please, reach out to the DFX Finance development team for clarification.

### Bug Bounty FAQ

**Q:** Is there a time limit for the Bug Bounty program?
**A:** No. The Bug Bounty program currently has no end date, but this can be changed at any time at the discretion of DFX Finance.

**Q:** How big is the Bug Bounty program?\
**A:** There is currently a rolling \$500,000 bounty for bugs. This amount may be changed by a DFX Finance governance vote.

**Q:** How are bounties paid out?\
**A:** Rewards are paid out in USDC.

**Q:** Can I submit bugs anonymously and still receive payment?\
**A:** Yes. If you wish to remain anonymous you can do so and still be eligible for rewards as long as they are for valid bugs. Rewards will be sent to the valid Ethereum address that you provide.

**Q:** Can I donate my reward to charity?\
**A:** Yes. You may donate your reward to a charity of your choosing, or to a gitcoin grant.

## Deviations from the Standard

The standard describes reporters of vulnerabilities including full details of an issue, in order to reproduce it. This is necessary for instance in the case of an external researcher both demonstrating and proving that there really is a security issue, and that security issue really has the impact that they say it
has - allowing the development team to accurately prioritize and resolve the issue.

In the case of a counterfeiting or fund-stealing bug affecting DFX Finance, however, we might decide not to include those details with our reports to partners ahead of coordinated release, as long as we are sure that they are not vulnerable.

## Credits

Parts of this document were inspired by [Grin's security policy](https://github.com/mimblewimble/grin/blob/master/SECURITY.md) and [Yearn Finance's security policy](https://github.com/yearn/yearn-security/blob/master/SECURITY.md).
