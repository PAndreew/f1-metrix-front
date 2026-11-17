#!/usr/bin/env python3
"""Export ONLY an immutable completed pilot. Never reads or alters a running fit."""
import argparse
import hashlib
import json
import math
from pathlib import Path


def passed(d):
    return d.get('passed') is True and all(isinstance(d.get(k),(int,float)) and math.isfinite(d[k]) for k in ['maxRhat','minEss','minBfmi','divergences','treeDepthSaturations']) and d['maxRhat']<=1.01 and d['minEss']>=400 and d['minBfmi']>=.3 and d['divergences']==0 and d['treeDepthSaturations']==0


def main():
    p=argparse.ArgumentParser();p.add_argument('--completed-pilot',required=True);p.add_argument('--prior-diagnostics',required=True);p.add_argument('--observations',default='publication/simulations.json');p.add_argument('--output',default='publication/sequential-preview.json');a=p.parse_args()
    source=json.loads(Path(a.completed_pilot).read_text());prior=json.loads(Path(a.prior_diagnostics).read_text());observations=json.loads(Path(a.observations).read_text())
    if not passed(prior) or source['cutoffExclusive']!='2026-01-01' or not source['priorApproximationCheck']['passed']:raise ValueError('Starting-prior checks failed')
    rows=source['races']
    if [r['round'] for r in rows]!=list(range(1,len(rows)+1)):raise ValueError('Only contiguous completed forecasts may be promoted')
    forecasts={r['round']:r for r in rows};new=[]
    for original in observations['races']:
        r={k:v for k,v in original.items() if k!='drivers'}
        if r['round'] not in forecasts:
            r.update(status='pending',drivers=[],observedDrivers=[{k:d[k] for k in ['driverId','name','officialPosition','officialPositionText','actualEligibleRank']} for d in original['drivers']]);new.append(r);continue
        forecast=forecasts[r['round']]
        if forecast['trainingThroughRound']!=r['round']-1 or forecast['date']!=r['date']:raise ValueError('Forecast cutoff mismatch')
        d=prior if r['round']==1 else forecasts[r['round']-1].get('updateDiagnostics',{})
        if not passed(d):raise ValueError('Required preceding update did not pass')
        training_date='2025-12-07' if r['round']==1 else forecasts[r['round']-1]['date']
        if training_date>=r['date']:raise ValueError('Future data leakage')
        predictions={d['driverId']:d for d in forecast['preResultDistribution']}
        if set(predictions)!={d['driverId'] for d in original['drivers']}:raise ValueError('Finisher fields disagree')
        results=[]
        for observed in original['drivers']:
            prediction=predictions[observed['driverId']];probability=prediction['positionProbabilities'];n=len(original['drivers'])
            if len(probability)!=n or any(not math.isfinite(x) or x<0 or x>1 for x in probability) or abs(sum(probability)-1)>1e-8:raise ValueError('Invalid probability distribution')
            mean=sum((i+1)*v for i,v in enumerate(probability))
            if abs(mean-prediction['expectedEligibleRank'])>1e-8:raise ValueError('Forecast mean mismatch')
            def quantile(p):
                cdf=0
                for i,v in enumerate(probability):
                    cdf+=v
                    if cdf+1e-12>=p:return i+1
                return n
            actual=observed['actualEligibleRank']
            results.append({**observed,'expectedEligibleRank':mean,'predictive80':[quantile(.1),quantile(.9)],'positionsAboveExpectation':mean-actual,'probabilityAtLeastAsGood':sum(probability[:actual]),'probabilityAtLeastAsBad':sum(probability[actual-1:]),'positionProbabilities':probability})
        r.update(status='ready',trainingThroughRound=forecast['trainingThroughRound'],trainingThroughDate=training_date,originDiagnostics=d,drivers=results);new.append(r)
    result={'kind':'sequential-preview-eligible-finisher','validatedForecast':False,'researchPreview':True,'model':'Sequential MCMC · experimental 2026 expectations','year':2026,'seed':1949,'simulationsPerRace':40000,'fitThroughDate':'2025-12-07','availableRounds':[r['round'] for r in rows],'sourceResultSha256':hashlib.sha256(Path(a.completed_pilot).read_bytes()).hexdigest(),'sourceCodeSha256':source['sourceCodeSha256'],'priorMetadataSha256':source['priorMetadataSha256'],'priorApproximation':source['priorApproximation'],'priorApproximationCheck':source['priorApproximationCheck'],'limitations':[f'{len(rows)} of {len(observations["races"])} rounds are available; later rounds are pending, not filled with old simulations.','Each forecast uses earlier race orders only, but its participant set is retrospectively conditioned on actual eligible finishers. Not a full-grid pre-race forecast.','Driver baseline, season form and team strength are inferred jointly; this is not isolated driving quality.',('The historical prior is approximated by a joint Gaussian; age uncertainty is propagated through the sequential updates.' if source['priorApproximationCheck'].get('ageUncertaintyRetained') else 'This early pilot uses a Gaussian historical prior and mean within-season age adjustment.'),'Reset/form/process settings are research choices. Historical backtests are encouraging but do not establish full-grid forecast calibration.','Model-derived ranges and descriptive tail frequencies are not calibrated confidence guarantees or p-values.'],'races':new}
    Path(a.output).write_text(json.dumps(result,indent=2));print(f'Exported {len(rows)} ready forecasts; {len(new)-len(rows)} rounds explicitly pending. No running model touched.')

if __name__=='__main__':main()
